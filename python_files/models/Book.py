from mongoengine import Document, StringField, DateTimeField, ListField, FloatField, DictField, IntField

class Book(Document):
    olid = StringField(required=True, unique=True)
    title = StringField(required=True)
    author = StringField(required=True)
    publish_date = DateTimeField()
    genres = ListField(StringField())
    topics = ListField(StringField())
    cover_url = StringField()
    description = StringField()
    embeddings = ListField(FloatField())  # For AI similarity matching
    metadata = DictField()
    ai_analysis = DictField()
    stats = DictField()

    meta = {
        'indexes': [
            {'fields': ['$title', "$author", "$genres", "$topics", "$description"], 'default_language': 'english'}
        ],
        'timestamps': True
    }

