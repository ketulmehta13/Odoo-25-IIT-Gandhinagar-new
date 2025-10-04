from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {
            'fields': ('role', 'company_name', 'currency')
        }),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Additional Info', {
            'fields': ('role', 'company_name', 'currency')
        }),
    )
    list_display = ('email', 'username', 'role', 'company_name', 'is_active')
    list_filter = ('role', 'is_active', 'company_name')
    search_fields = ('email', 'username', 'company_name')

admin.site.register(User, CustomUserAdmin)
