from django.contrib import admin
from posts.models import Post, PostTopic, PostMedia, Comment

admin.site.register(Post)
admin.site.register(PostTopic)
admin.site.register(PostMedia)
admin.site.register(Comment)