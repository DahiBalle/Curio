from django.contrib import admin
from posts.models import Post, PostMedia, Comment

admin.site.register(Post)
admin.site.register(PostMedia)
admin.site.register(Comment)