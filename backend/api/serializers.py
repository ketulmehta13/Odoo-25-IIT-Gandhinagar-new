from rest_framework import serializers
from .models import *
from accounts.models import User

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = '__all__'

class ExpenseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseCategory
        fields = '__all__'

class UserBasicSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'full_name', 'role']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

class ExpenseApprovalSerializer(serializers.ModelSerializer):
    approver_details = UserBasicSerializer(source='approver', read_only=True)
    
    class Meta:
        model = ExpenseApproval
        fields = '__all__'
# Add this to api/serializers.py

class ApprovalRuleSerializer(serializers.ModelSerializer):
    specific_approver_details = UserBasicSerializer(source='specific_approver', read_only=True)
    
    class Meta:
        model = ApprovalRule
        fields = '__all__'


class ApprovalFlowSerializer(serializers.ModelSerializer):
    steps = serializers.SerializerMethodField()
    rule_details = ApprovalRuleSerializer(source='rule', read_only=True)
    
    class Meta:
        model = ApprovalFlow
        fields = '__all__'
    
    def get_steps(self, obj):
        steps = ApprovalStep.objects.filter(approval_flow=obj).order_by('step_order')
        return ApprovalStepSerializer(steps, many=True).data


class ApprovalStepSerializer(serializers.ModelSerializer):
    specific_approver_details = UserBasicSerializer(source='specific_approver', read_only=True)
    
    class Meta:
        model = ApprovalStep
        fields = '__all__'

# In api/serializers.py
class ExpenseSerializer(serializers.ModelSerializer):
    employee_details = UserBasicSerializer(source='employee', read_only=True)
    category_details = ExpenseCategorySerializer(source='category', read_only=True)
    approvals = ExpenseApprovalSerializer(many=True, read_only=True)
    current_approver_details = UserBasicSerializer(source='current_approver', read_only=True)
    employee_name = serializers.SerializerMethodField()
    company_currency = serializers.SerializerMethodField()
    
    # Add these fields to ensure proper numeric formatting
    amount_numeric = serializers.SerializerMethodField()
    converted_amount_numeric = serializers.SerializerMethodField()
    
    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = ['employee', 'company', 'converted_amount', 'current_approver']
    
    def get_employee_name(self, obj):
        return obj.employee.get_full_name() if obj.employee else ''
    
    def get_company_currency(self, obj):
        return obj.company.currency if obj.company else 'USD'
    
    def get_amount_numeric(self, obj):
        return float(obj.amount) if obj.amount else 0.0
    
    def get_converted_amount_numeric(self, obj):
        return float(obj.converted_amount) if obj.converted_amount else float(obj.amount) if obj.amount else 0.0


class ExpenseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = ['amount', 'currency', 'category', 'description', 'expense_date', 'receipt_image']

class UserManagementSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    manager_relationships = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'full_name', 'role', 'company_name', 'is_active', 'date_joined', 'manager_relationships']
        
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()
    
    def get_manager_relationships(self, obj):
        if obj.role == 'employee':
            managers = ManagerEmployee.objects.filter(employee=obj, is_active=True)
            return [{'manager_id': me.manager.id, 'manager_name': me.manager.get_full_name()} for me in managers]
        elif obj.role == 'manager':
            employees = ManagerEmployee.objects.filter(manager=obj, is_active=True)
            return [{'employee_id': me.employee.id, 'employee_name': me.employee.get_full_name()} for me in employees]
        return []

class ManagerEmployeeSerializer(serializers.ModelSerializer):
    manager_details = UserBasicSerializer(source='manager', read_only=True)
    employee_details = UserBasicSerializer(source='employee', read_only=True)
    
    class Meta:
        model = ManagerEmployee
        fields = '__all__'
