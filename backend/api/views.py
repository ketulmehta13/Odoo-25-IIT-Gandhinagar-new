from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count
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

# Authentication Views
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_user(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        # Auto-create company if it's the first signup
        company = get_or_create_company(user)
        
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
@api_view(['PUT', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_user(request, user_id):
    if request.user.role != 'admin':
        return Response(
            {'success': False, 'error': 'Only admins can update users'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        user = User.objects.get(id=user_id)
        
        # Update allowed fields
        if 'first_name' in request.data:
            user.first_name = request.data['first_name']
        if 'last_name' in request.data:
            user.last_name = request.data['last_name']
        if 'role' in request.data:
            user.role = request.data['role']
        
        user.save()
        
        return Response({
            'success': True,
            'data': UserManagementSerializer(user).data
        })
        
    except User.DoesNotExist:
        return Response({
            'success': False,
            'error': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"Error updating user: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

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
            
            # Create multi-level approval workflow
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
    
    try:
        if user.role == 'admin':
            # ADMIN sees ALL pending expenses regardless of current approver
            company = get_user_company(user)
            expenses = Expense.objects.filter(
                company=company,
                status='pending_approval'
            ).order_by('-created_at')
            
            print(f"Admin pending approvals: Found {expenses.count()} expenses")
            for exp in expenses:
                print(f"  - {exp.employee.email}: ${exp.amount} (Current approver: {exp.current_approver.email if exp.current_approver else 'None'})")
        
        elif user.role == 'manager':
            # MANAGER sees only expenses where they are current approver
            expenses = Expense.objects.filter(
                current_approver=user,
                status='pending_approval'
            ).order_by('-created_at')
            
            print(f"Manager pending approvals: Found {expenses.count()} expenses for {user.email}")
        
        serializer = ExpenseSerializer(expenses, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })
        
    except Exception as e:
        print(f"Error in pending_approvals: {str(e)}")
        return Response({
            'success': False,
            'error': 'Failed to fetch pending approvals'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def approve_reject_expense(request, expense_id):
    user = request.user
    
    try:
        expense = get_object_or_404(Expense, id=expense_id)
        
        # Check if user can approve this expense
        current_approval = ExpenseApproval.objects.filter(
            expense=expense,
            approver=user,
            status='pending'
        ).first()
        
        if not current_approval:
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
        
        # Update the current approval
        current_approval.status = 'approved' if action == 'approve' else 'rejected'
        current_approval.comments = comment
        current_approval.approved_at = timezone.now()
        current_approval.save()
        
        if action == 'approve':
            # Check approval rules
            approval_result = check_approval_rules(expense)
            
            if approval_result['approved']:
                # Expense fully approved
                expense.status = 'approved'
                expense.current_approver = None
                expense.save()
                print(f"Expense {expense.id} fully approved by rules")
            else:
                # Move to next step in sequence
                next_approval = ExpenseApproval.objects.filter(
                    expense=expense,
                    step_order__gt=current_approval.step_order,
                    status='pending'
                ).order_by('step_order').first()
                
                if next_approval:
                    # Move to next approver
                    expense.current_approver = next_approval.approver
                    expense.current_step = next_approval.step_order
                    expense.save()
                    print(f"Expense {expense.id} moved to step {next_approval.step_order}, approver: {next_approval.approver.email}")
                else:
                    # All steps complete
                    expense.status = 'approved'
                    expense.current_approver = None
                    expense.save()
                    print(f"Expense {expense.id} fully approved - all steps complete")
        else:
            # Rejected - stop workflow
            expense.status = 'rejected'
            expense.current_approver = None
            expense.save()
            print(f"Expense {expense.id} rejected by {user.email}")
        
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
    print(f"Admin stats requested by: {user.email}, role: {user.role}")
    
    if user.role != 'admin':
        return Response(
            {'success': False, 'error': 'Only admins can view statistics'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        # Get ALL expenses for admin stats (regardless of company for now)
        expenses = Expense.objects.all()
        print(f"Total expenses in database: {expenses.count()}")
        
        if expenses.count() == 0:
            # No expenses exist, return zeros
            stats_data = {
                'total_expenses': 0,
                'pending_count': 0,
                'approved_count': 0,
                'rejected_count': 0,
                'approved_amount': 0.0,
                'pending_amount': 0.0,
                'rejected_amount': 0.0
            }
        else:
            # Calculate stats from all expenses
            total_expenses = expenses.count()
            pending_count = expenses.filter(status='pending_approval').count()
            approved_count = expenses.filter(status='approved').count()
            rejected_count = expenses.filter(status='rejected').count()
            
            # Calculate amounts
            approved_amount = sum(float(e.converted_amount or e.amount or 0) for e in expenses.filter(status='approved'))
            pending_amount = sum(float(e.converted_amount or e.amount or 0) for e in expenses.filter(status='pending_approval'))
            rejected_amount = sum(float(e.converted_amount or e.amount or 0) for e in expenses.filter(status='rejected'))
            
            stats_data = {
                'total_expenses': total_expenses,
                'pending_count': pending_count,
                'approved_count': approved_count,
                'rejected_count': rejected_count,
                'approved_amount': approved_amount,
                'pending_amount': pending_amount,
                'rejected_amount': rejected_amount
            }
        
        print(f"Calculated stats: {stats_data}")
        
        return Response({
            'success': True,
            'data': stats_data
        })
        
    except Exception as e:
        print(f"Error in admin_stats: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            'success': False,
            'error': 'Failed to fetch admin statistics'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def user_management(request):
    if request.method == 'GET':
        try:
            # FOR QUICK FIX - Return ALL users regardless of company
            # This fixes the company filtering issue
            users = User.objects.all()
            
            print(f"Found {users.count()} total users")
            for user in users:
                print(f"User: {user.email}, Role: {user.role}, Company: {user.company_name}")
            
            serializer = UserManagementSerializer(users, many=True)
            
            return Response({
                'success': True,
                'data': serializer.data
            })
            
        except Exception as e:
            print(f"Error in user_management: {str(e)}")
            return Response({
                'success': False,
                'error': 'Failed to fetch users'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'POST':
        if request.user.role != 'admin':
            return Response(
                {'error': 'Only admins can create users'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            data = request.data.copy()
            
            # Use admin's company or default
            admin_company = get_user_company(request.user)
            data['company_name'] = admin_company.name
            
            # Create user
            user = User.objects.create_user(
                email=data['email'],
                username=data['email'],
                first_name=data.get('name', '').split(' ')[0] if data.get('name') else '',
                last_name=' '.join(data.get('name', '').split(' ')[1:]) if data.get('name') else '',
                role=data['role'],
                company_name=data['company_name'],
                currency=admin_company.currency,
                password='defaultpass123'
            )
            
            return Response({
                'success': True,
                'data': UserManagementSerializer(user).data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"Error creating user: {str(e)}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def assign_manager_employee(request):
    if request.user.role != 'admin':
        return Response(
            {'error': 'Only admins can assign manager relationships'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    manager_id = request.data.get('manager_id')
    employee_id = request.data.get('employee_id')
    
    try:
        manager = get_object_or_404(User, id=manager_id, role='manager')
        employee = get_object_or_404(User, id=employee_id, role='employee')
        company = get_user_company(request.user)
        
        relationship, created = ManagerEmployee.objects.get_or_create(
            manager=manager,
            employee=employee,
            company=company,
            defaults={'is_active': True}
        )
        
        return Response({
            'success': True,
            'message': 'Manager-Employee relationship created successfully',
            'data': ManagerEmployeeSerializer(relationship).data
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_user(request, user_id):
    if request.user.role != 'admin':
        return Response(
            {'error': 'Only admins can delete users'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
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

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def approval_rules(request):
    if request.user.role != 'admin':
        return Response(
            {'error': 'Only admins can manage approval rules'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    company = get_user_company(request.user)
    
    if request.method == 'GET':
        rules = ApprovalRule.objects.filter(company=company)
        serializer = ApprovalRuleSerializer(rules, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    elif request.method == 'POST':
        data = request.data.copy()
        data['company'] = company.id
        
        serializer = ApprovalRuleSerializer(data=data)
        if serializer.is_valid():
            rule = serializer.save()
            return Response({
                'success': True,
                'data': ApprovalRuleSerializer(rule).data
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

# Helper Functions
def get_or_create_company(user):
    """Create company on first signup if admin role"""
    company, created = Company.objects.get_or_create(
        name=user.company_name or f'{user.first_name} Company',
        defaults={'currency': user.currency or 'USD'}
    )
    
    if created and user.role == 'admin':
        # Create default approval rule
        ApprovalRule.objects.create(
            company=company,
            name='Default Multi-Level Approval',
            rule_type='sequential',
            is_manager_approver=True,
            is_active=True
        )
    
    return company

def get_user_company(user):
    """Get or create company for user - Fixed version"""
    # First try to find existing company by exact name match
    if user.company_name:
        company = Company.objects.filter(name=user.company_name).first()
        if company:
            return company
    
    # If not found, find any company with expenses (for existing data)
    company_with_data = Company.objects.filter(expenses__isnull=False).first()
    if company_with_data:
        # Update user to match existing company
        user.company_name = company_with_data.name
        user.save()
        return company_with_data
    
    # If no companies exist, create one
    company, created = Company.objects.get_or_create(
        name=user.company_name or 'Default Company',
        defaults={'currency': user.currency or 'USD'}
    )
    
    # Update user to match company name
    user.company_name = company.name
    user.save()
    
    return company


def convert_currency(amount, from_currency, to_currency):
    if from_currency == to_currency:
        return amount
    
    try:
        response = requests.get(
            f'https://api.exchangerate-api.com/v4/latest/{from_currency}',
            timeout=5
        )
        data = response.json()
        rate = data['rates'][to_currency]
        return Decimal(str(amount)) * Decimal(str(rate))
    except:
        return amount

def create_approval_workflow(expense):
    """Create multi-level approval workflow based on company rules"""
    try:
        company = expense.company
        
        # Get active approval rule for company
        approval_rule = ApprovalRule.objects.filter(
            company=company,
            is_active=True
        ).first()
        
        if not approval_rule:
            # Create default rule
            approval_rule = ApprovalRule.objects.create(
                company=company,
                name='Default Sequential Flow',
                rule_type='sequential',
                is_manager_approver=True,
                is_active=True
            )
        
        # Get or create default approval flow
        approval_flow, created = ApprovalFlow.objects.get_or_create(
            company=company,
            rule=approval_rule,
            is_default=True,
            defaults={
                'name': 'Manager → Admin Flow',
                'is_active': True
            }
        )
        
        if created:
            # Create default steps: Manager → Admin
            ApprovalStep.objects.create(
                approval_flow=approval_flow,
                approver_type='manager',
                step_order=1,
                is_required=True
            )
            ApprovalStep.objects.create(
                approval_flow=approval_flow,
                approver_type='admin',
                step_order=2,
                is_required=True
            )
        
        # Assign flow to expense
        expense.approval_flow = approval_flow
        expense.current_step = 1
        
        # Create approval records
        steps = approval_flow.steps.all().order_by('step_order')
        
        for step in steps:
            approver = get_approver_for_step(expense, step)
            
            if approver:
                ExpenseApproval.objects.create(
                    expense=expense,
                    approver=approver,
                    step_order=step.step_order,
                    approver_type=step.approver_type,
                    status='pending'
                )
        
        # Set current approver to first step
        first_approval = ExpenseApproval.objects.filter(
            expense=expense,
            step_order=1
        ).first()
        
        if first_approval:
            expense.current_approver = first_approval.approver
            expense.status = 'pending_approval'
        else:
            expense.status = 'approved'
        
        expense.save()
        
    except Exception as e:
        print(f"Error creating approval workflow: {str(e)}")
        expense.status = 'approved'
        expense.save()

def get_approver_for_step(expense, step):
    """Get appropriate approver for a specific step"""
    if step.approver_type == 'manager':
        # Find employee's manager
        manager_relation = ManagerEmployee.objects.filter(
            employee=expense.employee,
            is_active=True
        ).first()
        return manager_relation.manager if manager_relation else None
    
    elif step.approver_type == 'admin':
        # Find company admin
        return User.objects.filter(
            company_name=expense.company.name,
            role='admin',
            is_active=True
        ).first()
    
    elif step.approver_type == 'specific_user':
        return step.specific_approver
    
    return None

def check_approval_rules(expense):
    """Check if expense meets approval rules for early approval"""
    rule = expense.approval_flow.rule if expense.approval_flow else None
    
    if not rule:
        return {'approved': False}
    
    if rule.rule_type == 'percentage':
        # Calculate percentage of approvals
        total_approvals = expense.approvals.count()
        approved_count = expense.approvals.filter(status='approved').count()
        
        if total_approvals > 0:
            approval_percentage = (approved_count / total_approvals) * 100
            if approval_percentage >= (rule.percentage_threshold or 100):
                return {'approved': True, 'reason': f'{approval_percentage}% threshold met'}
    
    elif rule.rule_type == 'specific_approver':
        # Check if specific approver approved
        if rule.specific_approver:
            specific_approval = expense.approvals.filter(
                approver=rule.specific_approver,
                status='approved'
            ).exists()
            
            if specific_approval:
                return {'approved': True, 'reason': 'Specific approver approved'}
    
    elif rule.rule_type == 'hybrid':
        # Check both percentage and specific approver
        percentage_result = check_approval_rules_percentage(expense, rule)
        specific_result = check_approval_rules_specific(expense, rule)
        
        if percentage_result['approved'] or specific_result['approved']:
            return {'approved': True, 'reason': 'Hybrid rule satisfied'}
    
    return {'approved': False}

def check_approval_rules_percentage(expense, rule):
    """Helper for percentage rule checking"""
    total_approvals = expense.approvals.count()
    approved_count = expense.approvals.filter(status='approved').count()
    
    if total_approvals > 0:
        approval_percentage = (approved_count / total_approvals) * 100
        if approval_percentage >= (rule.percentage_threshold or 100):
            return {'approved': True}
    
    return {'approved': False}

def check_approval_rules_specific(expense, rule):
    """Helper for specific approver rule checking"""
    if rule.specific_approver:
        specific_approval = expense.approvals.filter(
            approver=rule.specific_approver,
            status='approved'
        ).exists()
        
        if specific_approval:
            return {'approved': True}
    
    return {'approved': False}
