from django.urls import path
from .views import LoginView, StudentListView,LogoutAPIView,RegisterView,DashboardView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view()),
    path('dashboard/', DashboardView.as_view()), 
    path('students/', StudentListView.as_view()),
    path('logout/', LogoutAPIView.as_view(), name='logout'),
]