from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone
from accounts.models import User
from accounts.serializers import (
    UserRegistrationSerializer, 
    UserLoginSerializer, 
    UserProfileSerializer
)
from .models import *
from .serializers import *
import requests
from decimal import Decimal

# Authentication Views (REQUIRED - these were missing)
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_user(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        
        # Add custom claims
        access_token['role'] = user.role
        access_token['email'] = user.email
        
        return Response({
            'success': True,
            'message': 'User registered successfully',
            'data': {
                'user': UserProfileSerializer(user).data,
                'tokens': {
                    'access': str(access_token),
                    'refresh': str(refresh),
                }
            }
        }, status=status.HTTP_201_CREATED)
    
    return Response({
        'success': False,
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_user(request):
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        
        # Add custom claims
        access_token['role'] = user.role
        access_token['email'] = user.email
        
        return Response({
            'success': True,
            'message': 'Login successful',
            'data': {
                'user': UserProfileSerializer(user).data,
                'tokens': {
                    'access': str(access_token),
                    'refresh': str(refresh),
                }
            }
        }, status=status.HTTP_200_OK)
    
    return Response({
        'success': False,
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_profile(request):
    serializer = UserProfileSerializer(request.user)
    return Response({
        'success': True,
        'data': serializer.data
    })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_user(request):
    try:
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({
                'success': False,
                'error': 'Refresh token is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        token = RefreshToken(refresh_token)
        token.blacklist()
        
        return Response({
            'success': True,
            'message': 'Successfully logged out'
        }, status=status.HTTP_200_OK)
    except TokenError as e:
        return Response({
            'success': False,
            'error': 'Invalid or expired token'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'success': False,
            'error': 'Logout failed'
        }, status=status.HTTP_400_BAD_REQUEST)

# Expense Management Views
class ExpensePagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def expense_list_create(request):
    user = request.user
    
    if request.method == 'GET':
        # Filter expenses based on user role
        if user.role == 'admin':
            company = get_user_company(user)
            expenses = Expense.objects.filter(company=company)
        elif user.role == 'manager':
            # Get expenses from managed employees + own expenses
            managed_employees = ManagerEmployee.objects.filter(
                manager=user, is_active=True
            ).values_list('employee_id', flat=True)
            expenses = Expense.objects.filter(
                Q(employee=user) | Q(employee_id__in=managed_employees)
            )
        else:  # employee
            expenses = Expense.objects.filter(employee=user)
        
        # Apply filters
        status_filter = request.query_params.get('status')
        if status_filter and status_filter != 'all':
            expenses = expenses.filter(status=status_filter)
        
        serializer = ExpenseSerializer(expenses, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    elif request.method == 'POST':
        # Only employees can create expenses
        if user.role != 'employee':
            return Response(
                {'error': 'Only employees can submit expenses'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = ExpenseCreateSerializer(data=request.data)
        if serializer.is_valid():
            company = get_user_company(user)
            
            # Convert currency if needed
            converted_amount = serializer.validated_data['amount']
            if serializer.validated_data['currency'] != company.currency:
                converted_amount = convert_currency(
                    serializer.validated_data['amount'],
                    serializer.validated_data['currency'],
                    company.currency
                )
            
            expense = serializer.save(
                employee=user,
                company=company,
                converted_amount=converted_amount,
                status='submitted',
                submitted_at=timezone.now()
            )
            
            # Create approval workflow
            create_approval_workflow(expense)
            
            return Response(
                ExpenseSerializer(expense).data, 
                status=status.HTTP_201_CREATED
            )
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def pending_approvals(request):
    user = request.user
    
    if user.role not in ['manager', 'admin']:
        return Response(
            {'error': 'Only managers and admins can view pending approvals'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get expenses where user is the current approver
    expenses = Expense.objects.filter(
        current_approver=user,
        status='pending_approval'
    )
    
    serializer = ExpenseSerializer(expenses, many=True)
    return Response({
        'success': True,
        'data': serializer.data
    })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def approve_reject_expense(request, expense_id):
    user = request.user
    
    try:
        expense = get_object_or_404(Expense, id=expense_id)
        
        # Check if user can approve this expense
        if expense.current_approver != user:
            return Response(
                {'success': False, 'error': 'You are not authorized to approve this expense'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        action = request.data.get('action')  # 'approve' or 'reject'
        comment = request.data.get('comment', '')
        
        if action not in ['approve', 'reject']:
            return Response(
                {'success': False, 'error': 'Invalid action'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update the approval
        approval, created = ExpenseApproval.objects.get_or_create(
            expense=expense, 
            approver=user,
            defaults={'step_order': 1, 'status': 'pending'}
        )
        
        approval.status = 'approved' if action == 'approve' else 'rejected'
        approval.comments = comment
        approval.approved_at = timezone.now()
        approval.save()
        
        if action == 'approve':
            # Check if there are more approvers needed
            next_approval = ExpenseApproval.objects.filter(
                expense=expense,
                step_order__gt=approval.step_order,
                status='pending'
            ).first()
            
            if next_approval:
                # Move to next approver
                expense.current_approver = next_approval.approver
                expense.save()
            else:
                # All approvals complete
                expense.status = 'approved'
                expense.current_approver = None
                expense.save()
        else:
            # Rejected
            expense.status = 'rejected'
            expense.current_approver = None
            expense.save()
        
        return Response({
            'success': True,
            'message': f'Expense {action}d successfully',
            'data': ExpenseSerializer(expense).data
        })
        
    except Exception as e:
        print(f"Error in approve_reject_expense: {str(e)}")
        return Response({
            'success': False,
            'error': 'Failed to process expense approval'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def admin_stats(request):
    user = request.user
    if user.role != 'admin':
        return Response(
            {'error': 'Only admins can view statistics'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    company = get_user_company(user)
    expenses = Expense.objects.filter(company=company)
    
    stats = {
        'total_expenses': expenses.count(),
        'pending_count': expenses.filter(status='pending_approval').count(),
        'approved_count': expenses.filter(status='approved').count(),
        'rejected_count': expenses.filter(status='rejected').count(),
        'approved_amount': float(sum(
            e.converted_amount or 0 for e in expenses.filter(status='approved')
        )),
        'pending_amount': float(sum(
            e.converted_amount or 0 for e in expenses.filter(status='pending_approval')
        ))
    }
    
    return Response({
        'success': True,
        'data': stats
    })

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def user_management(request):
    if request.method == 'GET':
        # Return all users for admin
        users = User.objects.all()
        serializer = UserManagementSerializer(users, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    elif request.method == 'POST':
        data = request.data.copy()
        user = User.objects.create_user(
            email=data['email'],
            username=data['email'],
            first_name=data.get('name', '').split(' ')[0] if data.get('name') else '',
            last_name=' '.join(data.get('name', '').split(' ')[1:]) if data.get('name') else '',
            role=data['role'],
            company_name=data.get('company_name', 'Default Company'),
            password='defaultpass123'
        )
        
        return Response({
            'success': True,
            'data': UserManagementSerializer(user).data
        }, status=status.HTTP_201_CREATED)

@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_user(request, user_id):
    user = get_object_or_404(User, id=user_id)
    user.is_active = False
    user.save()
    
    return Response({
        'success': True,
        'message': 'User deactivated successfully'
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def expense_categories(request):
    company = get_user_company(request.user)
    categories = ExpenseCategory.objects.filter(company=company, is_active=True)
    serializer = ExpenseCategorySerializer(categories, many=True)
    return Response({
        'success': True,
        'data': serializer.data
    })

# Helper Functions
def get_user_company(user):
    company, created = Company.objects.get_or_create(
        name=user.company_name or 'Default Company',
        defaults={'currency': user.currency or 'USD'}
    )
    
    # Create default categories for new companies
    if created:
        default_categories = ['Travel', 'Meals', 'Office Supplies', 'Transportation', 'Entertainment']
        for cat_name in default_categories:
            ExpenseCategory.objects.create(name=cat_name, company=company)
    
    return company

def convert_currency(amount, from_currency, to_currency):
    if from_currency == to_currency:
        return amount
    
    try:
        # Use real currency API
        response = requests.get(
            f'https://api.exchangerate-api.com/v4/latest/{from_currency}',
            timeout=5
        )
        data = response.json()
        rate = data['rates'][to_currency]
        return Decimal(str(amount)) * Decimal(str(rate))
    except:
        # Fallback to 1:1 conversion
        return amount

def create_approval_workflow(expense):
    # Simple workflow: manager approval required
    try:
        manager_relation = ManagerEmployee.objects.filter(
            employee=expense.employee,
            is_active=True
        ).first()
        
        if manager_relation:
            ExpenseApproval.objects.create(
                expense=expense,
                approver=manager_relation.manager,
                step_order=1,
                status='pending'
            )
            expense.current_approver = manager_relation.manager
            expense.status = 'pending_approval'
            expense.save()
        else:
            # No manager, auto-approve or send to admin
            expense.status = 'approved'
            expense.save()
    except Exception as e:
        # Fallback: auto-approve
        expense.status = 'approved'
        expense.save()
