from django.urls import path
from . import views

urlpatterns = [

    # Persona Management
    path("create/", views.create_persona, name="create-persona"),
    path("", views.my_personas, name="my-personas"),
    path("active/", views.active_persona, name="active-persona"),
    path("switch/", views.switch_persona, name="switch-persona"),

    # Update & Delete
    path("<int:persona_id>/update/", views.update_persona, name="update-persona"),
    path("<int:persona_id>/delete/", views.delete_persona, name="delete-persona"),

]