from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Authentication endpoints
    path('auth/register/', views.register_user, name='register'),
    path('auth/login/', views.login_user, name='login'),
    path('auth/logout/', views.logout_user, name='logout'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/profile/', views.get_user_profile, name='profile'),
    
    # Expense Management endpoints
    path('expenses/', views.expense_list_create, name='expense-list-create'),
    path('expenses/pending/', views.pending_approvals, name='pending-approvals'),
    path('expenses/<uuid:expense_id>/approve/', views.approve_reject_expense, name='approve-expense'),
    path('expenses/categories/', views.expense_categories, name='expense-categories'),
    
    # Admin endpoints
    path('admin/stats/', views.admin_stats, name='admin-stats'),
    path('admin/users/', views.user_management, name='user-management'),
    path('admin/users/<int:user_id>/', views.delete_user, name='delete-user'),
    
    # Manager-Employee Assignment
    path('assign-manager/', views.assign_manager_employee, name='assign-manager'),
]
