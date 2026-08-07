from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Map all apps to the api/ prefix
    path('api/', include('accounts.urls')),
    path('api/personas/', include('personas.urls')),
    path('api/posts/', include('posts.urls')),
    path('api/feed/', include('feed.urls')),
    path('api/', include('interactions.urls')), # handles posts/... and messages/...
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
