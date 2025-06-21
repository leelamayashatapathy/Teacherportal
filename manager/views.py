from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Student
from rest_framework.permissions import AllowAny,IsAuthenticated
from django.contrib.auth.models import User
from .serializers import StudentSerializer, LoginSerializer, UserSerializer
from .utils import StudentListPagination



class RegisterView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        return render(request, 'register.html')
    
    
    def post(self, request):
        u_name = request.data.get('username')
        pwd = request.data.get('password')

        if not u_name or not pwd:
            return Response({'error': 'Username and password needed.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.create_user(username=u_name, password=pwd)
            return Response({'success': 'User registered successfully.'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': 'Username already exists.'}, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    def get(self, request):
        return render(request, 'login.html')
    
    def post(self, request):
        
        try:
            serializer = LoginSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.validated_data
                refresh = RefreshToken.for_user(user)
                return Response({
                    'msg': "Login Successful",
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': UserSerializer(user).data
                })
            else:
                return Response({
                    'msg': "Invalid credentials",
                    'user': serializer.errors
                })
        except Exception as e:
            return Response({'msg': "Something went wrong"},status=status.HTTP_400_BAD_REQUEST)
            
        
        
class DashboardView(APIView):
    def get(self, request):
        try:
            return render(request, 'dashboard.html')
        except Exception as e:
            return Response({'msg': "Something went wrong"},status=status.HTTP_400_BAD_REQUEST)
    
class StudentListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            students = Student.objects.filter(teacher=request.user).order_by('-id')

            paginator = StudentListPagination()
            result_page = paginator.paginate_queryset(students, request)
            serializer = StudentSerializer(result_page, many=True)
            return paginator.get_paginated_response(serializer.data)
        except Exception as e:
            return Response({
                'msg': "Failed to fetch student data.",
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        # return Response(StudentSerializer(students, many=True).data)

    def post(self, request):
        try:
            data = request.data
            name = data.get('name')
            subject = data.get('subject')
            mark = int(data.get('mark', 0))

            student, created = Student.objects.get_or_create(
                name=name,
                subject=subject,
                teacher=request.user,
                defaults={'mark': mark}
            )

            if not created:
                student.mark += mark
                student.save()
                message = "Student updated"
            else:
                message = "Student created successfully."

            return Response({
                'msg': message,
                'data': StudentSerializer(student).data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'msg': "Something went wrong ",
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        try:
            student = Student.objects.get(id=request.data['id'], teacher=request.user)
        except Student.DoesNotExist:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = StudentSerializer(student, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request):
        try:
            student = Student.objects.get(id=request.data['id'], teacher=request.user)
            student.delete()
            return Response({'status': 'deleted'})
        except Student.DoesNotExist:
            return Response({'error': 'Student not found or unauthorized.'}, status=status.HTTP_404_NOT_FOUND)




class LogoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Logged out successfully."}, status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)