from django.contrib import admin
from personas.models import Topic, Persona, PersonaTopic

admin.site.register(Topic)
admin.site.register(Persona)
admin.site.register(PersonaTopic)