from rest_framework import serializers
from django.utils import timezone
from django import forms
from datetime import date


class LoginSerializer(forms.Form):
    REQUIRED_MSG = "email and dob is required"
     
    email = forms.EmailField(
        required=True,
        error_messages={'required': REQUIRED_MSG, 'invalid': 'Enter a valid email address.'}
    )
    dob = forms.DateField(
        required=True,
        input_formats=['%Y-%m-%d'],
        error_messages={'required': REQUIRED_MSG, 'invalid': 'dob must be YYYY-MM-DD'}
    )

    def clean_email(self):
        value = self.cleaned_data['email']
        domain = value.split('@')[-1].lower()

        if domain != "acropolis.in":
            raise forms.ValidationError("Email must be at @acropolis.in domain.")
        
        return value

    def clean_dob(self):
        value = self.cleaned_data['dob']
        today = date.today()

        if value >= today:
            raise forms.ValidationError("dob must be in the past.")

        age = (today - value).days // 365
        if age < 15:
            raise forms.ValidationError("Age must be at least 15 years.")

        return value
class FeedbackSerializer(forms.Form):

    subject_code = forms.CharField(
        required=True,
        max_length=50,
        error_messages={
            'required': 'subject_code is required',
            'max_length': 'subject_code must be at most 50 characters'
        }
    )

    allocation_id = forms.IntegerField(
        required=True,
        error_messages={
            'required': 'allocation_id is required',
            'invalid': 'allocation_id must be an integer'
        }
    )

    q1 = forms.IntegerField(min_value=1, max_value=5, required=True,
        error_messages={"required": "q1 is required", "min_value": "rating must be 1–5", "max_value": "rating must be 1–5"})
    q2 = forms.IntegerField(min_value=1, max_value=5, required=True,
        error_messages={"required": "q2 is required", "min_value": "rating must be 1–5", "max_value": "rating must be 1–5"})
    q3 = forms.IntegerField(min_value=1, max_value=5, required=True,
        error_messages={"required": "q3 is required", "min_value": "rating must be 1–5", "max_value": "rating must be 1–5"})
    q4 = forms.IntegerField(min_value=1, max_value=5, required=True,
        error_messages={"required": "q4 is required", "min_value": "rating must be 1–5", "max_value": "rating must be 1–5"})
    q5 = forms.IntegerField(min_value=1, max_value=5, required=True,
        error_messages={"required": "q5 is required", "min_value": "rating must be 1–5", "max_value": "rating must be 1–5"})
    q6 = forms.IntegerField(min_value=1, max_value=5, required=True,
        error_messages={"required": "q6 is required", "min_value": "rating must be 1–5", "max_value": "rating must be 1–5"})
    q7 = forms.IntegerField(min_value=1, max_value=5, required=True,
        error_messages={"required": "q7 is required", "min_value": "rating must be 1–5", "max_value": "rating must be 1–5"})
    q8 = forms.IntegerField(min_value=1, max_value=5, required=True,
        error_messages={"required": "q8 is required", "min_value": "rating must be 1–5", "max_value": "rating must be 1–5"})
    q9 = forms.IntegerField(min_value=1, max_value=5, required=True,
        error_messages={"required": "q9 is required", "min_value": "rating must be 1–5", "max_value": "rating must be 1–5"})
    q10 = forms.IntegerField(min_value=1, max_value=5, required=True,
        error_messages={"required": "q10 is required", "min_value": "rating must be 1–5", "max_value": "rating must be 1–5"})

    comments = forms.CharField(required=False, max_length=500)

    # --- Cleaners ---
    def clean_subject_code(self):
        value = self.cleaned_data.get("subject_code")
        return value.upper().strip() if value else value

    def clean_comments(self):
        value = self.cleaned_data.get("comments")
        return value.strip() if value else value

    def clean(self):
        return super().clean()
