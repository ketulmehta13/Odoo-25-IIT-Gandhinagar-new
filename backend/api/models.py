from django.db import models
from accounts.models import User
from django.core.validators import MinValueValidator
import uuid

class Company(models.Model):
    name = models.CharField(max_length=200)
    currency = models.CharField(max_length=10, default='USD')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

class ExpenseCategory(models.Model):
    name = models.CharField(max_length=100)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='categories')
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name_plural = "Expense Categories"
    
    def __str__(self):
        return self.name

class ApprovalRule(models.Model):
    RULE_TYPES = (
        ('sequential', 'Sequential Flow'),
        ('percentage', 'Percentage Rule'),
        ('specific_approver', 'Specific Approver Rule'),
        ('hybrid', 'Hybrid Rule'),
    )
    
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='approval_rules')
    name = models.CharField(max_length=200)
    rule_type = models.CharField(max_length=20, choices=RULE_TYPES, default='sequential')
    percentage_threshold = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(1)])
    specific_approver = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='specific_approval_rules')
    amount_threshold = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_manager_approver = models.BooleanField(default=True)  # New field
    
    def __str__(self):
        return f"{self.name} - {self.company.name}"

class ApprovalFlow(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='approval_flows')
    name = models.CharField(max_length=200)
    rule = models.ForeignKey(ApprovalRule, on_delete=models.CASCADE, related_name='flows')
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.name} - {self.company.name}"

class ApprovalStep(models.Model):
    APPROVER_TYPES = (
        ('manager', 'Manager'),
        ('admin', 'Admin'),
        ('finance', 'Finance'),
        ('director', 'Director'),
        ('specific_user', 'Specific User'),
    )
    
    approval_flow = models.ForeignKey(ApprovalFlow, on_delete=models.CASCADE, related_name='steps')
    approver_type = models.CharField(max_length=20, choices=APPROVER_TYPES)
    specific_approver = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    step_order = models.IntegerField()
    is_required = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['step_order']
        unique_together = ['approval_flow', 'step_order']

class Expense(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('pending_approval', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('paid', 'Paid'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='expenses')
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='expenses')
    
    # Expense Details
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)])
    currency = models.CharField(max_length=10)
    converted_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    category = models.ForeignKey(ExpenseCategory, on_delete=models.SET_NULL, null=True)
    description = models.TextField()
    expense_date = models.DateField()
    
    # Receipt
    receipt_image = models.ImageField(upload_to='receipts/', null=True, blank=True)
    
    # Approval Workflow
    approval_flow = models.ForeignKey(ApprovalFlow, on_delete=models.SET_NULL, null=True, blank=True)
    current_step = models.IntegerField(default=1)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    current_approver = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='pending_approvals')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.employee.get_full_name()} - {self.amount} {self.currency}"

class ExpenseApproval(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    
    expense = models.ForeignKey(Expense, on_delete=models.CASCADE, related_name='approvals')
    approver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='expense_approvals')
    step_order = models.IntegerField()
    approver_type = models.CharField(max_length=20, default='manager')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    comments = models.TextField(blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['step_order']
        unique_together = ['expense', 'step_order']

class ManagerEmployee(models.Model):
    manager = models.ForeignKey(User, on_delete=models.CASCADE, related_name='managed_employees')
    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='manager_relationships')
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['manager', 'employee', 'company']
