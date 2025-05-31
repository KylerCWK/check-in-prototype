from mongoengine import Document, ReferenceField, ListField, StringField, BooleanField, IntField, DateTimeField, DictField, FloatField, EmbeddedDocument, EmbeddedDocumentField
from datetime import datetime

class Progress(EmbeddedDocument):
    pages_read = IntField()
    time_spent = IntField()  # in minutes
    last_read_date = DateTimeField()

class ReadingHistory(EmbeddedDocument):
    book = ReferenceField('Book')
    status = StringField(choices=['want_to_read', 'reading', 'completed', 'abandoned'], default='want_to_read')
    favorite = BooleanField(default=False)
    view_count = IntField(default=0)
    last_viewed = DateTimeField()
    total_view_duration = IntField(default=0)  # in seconds
    progress = EmbeddedDocumentField(Progress)
    rating = IntField(min_value=1, max_value=5)
    notes = StringField()
    date_added = DateTimeField(default=datetime.now)

class ReadingGoals(EmbeddedDocument):
    books_per_month = IntField()
    hours_per_week = IntField()

class Preferences(EmbeddedDocument):
    genres = ListField(StringField())
    authors = ListField(StringField())
    topics = ListField(StringField())
    reading_goals = EmbeddedDocumentField(ReadingGoals)
    reading_level = StringField(choices=['beginner', 'intermediate', 'advanced', 'expert'])

class RecommendedBook(EmbeddedDocument):
    book = ReferenceField('Book')
    score = FloatField()
    reason = StringField()
    date_generated = DateTimeField()

class ReadingPatterns(EmbeddedDocument):
    preferred_genres = ListField(DictField())
    preferred_topics = ListField(DictField())
    reading_speed = FloatField()  # words per minute
    completion_rate = FloatField()  # percentage of books completed
    average_rating = FloatField()

class AIProfile(EmbeddedDocument):
    interest_vector = ListField(FloatField())  # AI-generated interest embedding
    reading_patterns = EmbeddedDocumentField(ReadingPatterns)
    recommendations = ListField(EmbeddedDocumentField(RecommendedBook))
    last_updated = DateTimeField()

class ReadingProfile(Document):
    user = ReferenceField('User', required=True)
    reading_history = ListField(EmbeddedDocumentField(ReadingHistory))
    preferences = EmbeddedDocumentField(Preferences)
    ai_profile = EmbeddedDocumentField(AIProfile)

    # Method to update AI profile
    def update_ai_profile(self):
        # This will be implemented when we add the AI processing
        # It will analyze reading history and update the AI profile
        pass

    # Method to get personalized recommendations
    def get_recommendations(self):
        # This will be implemented when we add the recommendation engine
        # It will use the AI profile to generate recommendations
        pass

