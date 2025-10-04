from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Authentication endpoints
    path('auth/register/', views.register_user, name='register'),
    path('auth/login/', views.login_user, name='login'),
    path('auth/logout/', views.logout_user, name='logout'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User profile
    path('auth/profile/', views.get_user_profile, name='profile'),
    
    # Role-specific endpoints (examples)
    # path('admin/', include('api.admin_urls')),
    # path('manager/', include('api.manager_urls')),
    # path('employee/', include('api.employee_urls')),
]
