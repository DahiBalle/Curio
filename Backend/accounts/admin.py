from django.contrib import admin

from accounts.models import User
from accounts.models import Follow
from accounts.models import Profile

# Register your models here.
admin.site.register(User)
admin.site.register(Follow)
admin.site.register(Profile)