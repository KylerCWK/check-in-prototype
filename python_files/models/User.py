from mongoengine import Document, StringField, BooleanField, ReferenceField, DateTimeField, EmbeddedDocument, EmbeddedDocumentField
from mongoengine import connect

connect('your_database_name')

class Profile(EmbeddedDocument):
    name = StringField()
    avatar = StringField()
    bio = StringField()
    location = StringField()

class Preferences(EmbeddedDocument):
    email_notifications = {
        'daily_recommendations': BooleanField(default=True),
        'weekly_digest': BooleanField(default=True),
        'new_releases': BooleanField(default=True)
    }
    ai_features = {
        'personalized_summaries': BooleanField(default=True),
        'reading_insights': BooleanField(default=True)
    }

class User(Document):
    email = StringField(required=True, unique=True)
    password = StringField(required=True)
    profile = EmbeddedDocumentField(Profile)
    reading_profile = ReferenceField('ReadingProfile')
    preferences = EmbeddedDocumentField(Preferences)
    subscription = StringField(choices=['free', 'basic', 'pro'], default='free')
    last_active = DateTimeField()

    meta = {
        'timestamps': True
    }

    async def get_recommendations(self):
        await self.reading_profile.reload()
        if self.reading_profile:
            return await self.reading_profile.get_recommendations()
        return []

    async def initialize_reading_profile(self):
        from ReadingProfile import ReadingProfile  # Assuming ReadingProfile is defined in reading_profile.py
        profile = ReadingProfile(user=self.id)
        await profile.save()
        self.reading_profile = profile.id
        await self.save()
        return profile


