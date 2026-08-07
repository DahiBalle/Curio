from django.contrib import admin

from accounts.models import User
from accounts.models import Follow

# Register your models here.
admin.site.register(User)
admin.site.register(Follow)