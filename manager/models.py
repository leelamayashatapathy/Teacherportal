from django.db import models
from django.contrib.auth.models import User



class Student(models.Model):
    teacher = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    subject = models.CharField(max_length=100)
    mark = models.IntegerField()

    class Meta:
        unique_together = ("teacher", "name", "subject")
    
    def __str__(self):
        return self.name