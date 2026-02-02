from django.db import models
from django.core.validators import EmailValidator, MinValueValidator, MaxLengthValidator, RegexValidator

GENDER_CHOICES = (
    ('M', 'Male'),
    ('F', 'Female'),
    ('O', 'Other'),
)

class Users_Student(models.Model):
    EnrollmentNo = models.CharField(max_length=50, primary_key=True, validators=[MaxLengthValidator(50)])
    FullName = models.CharField(max_length=255)
    Gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    Email = models.CharField(max_length=255, validators=[EmailValidator()])
    Branch = models.CharField(max_length=255)
    Year = models.PositiveSmallIntegerField(validators=[MinValueValidator(1)])
    Semester = models.PositiveSmallIntegerField(validators=[MinValueValidator(1)])
    Section = models.PositiveSmallIntegerField(validators=[MinValueValidator(1)])
    IsActive = models.BooleanField(default=True)
    DateOfBirth = models.DateField(null=True, blank=True, verbose_name="Date of Birth")

    class Meta:
        db_table = "Users_Student"
        managed = False

    def __str__(self):
        return f"{self.EnrollmentNo} - {self.FullName}"