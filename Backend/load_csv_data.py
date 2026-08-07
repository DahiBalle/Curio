import os
import django
import csv
import random
import sys

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User
from personas.models import Persona, Topic
from posts.models import Post, Comment
from interactions.models import Interaction

def clean_key(k):
    return k.strip().lower()

def load_data(userdata_csv_path, post_csv_path):
    print("Loading users and personas...")
    personas = []
    
    with open(userdata_csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        # Clean headers
        reader.fieldnames = [clean_key(field) for field in reader.fieldnames]
        
        for row in reader:
            username = row.get('username')
            name = row.get('name')
            bio = row.get('user bio', '')
            
            if not username or not name:
                print(f"Skipping row missing username or name: {row}")
                continue
                
            email = f"{username}@example.com"
            
            user, created = User.objects.get_or_create(username=username, defaults={'email': email})
            if created:
                user.set_password('password123')
                user.save()
            
            persona, p_created = Persona.objects.get_or_create(
                user=user,
                name=name,
                defaults={'bio': bio}
            )
            personas.append(persona)
            
            if not user.default_persona:
                user.default_persona = persona
                user.save()

    print(f"Loaded {len(personas)} personas.")

    print("Loading posts...")
    with open(post_csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        # Clean headers
        reader.fieldnames = [clean_key(field) for field in reader.fieldnames]
        
        for row in reader:
            title = row.get('title')
            content = row.get('selftext')
            broad_topic_name = row.get('category_1', 'General')
            narrow_topic_name = row.get('category_2', 'General')
            
            if not title or not content:
                print(f"Skipping row missing title or content: {row}")
                continue
            
            broad_topic, _ = Topic.objects.get_or_create(name=broad_topic_name, topic_type=Topic.BROAD)
            narrow_topic, _ = Topic.objects.get_or_create(name=narrow_topic_name, topic_type=Topic.NARROW, parent=broad_topic)
            
            author = random.choice(personas) if personas else None
            
            if not author:
                print("No personas available to author posts. Skipping post creation.")
                continue

            # Generate random counts
            likes = random.randint(0, 50)
            clicks = random.randint(likes, likes + 100)
            impressions = random.randint(clicks, clicks + 500)

            # Generate dummy random embedding for the post (384 dimensions)
            dummy_embedding = [random.uniform(-1.0, 1.0) for _ in range(384)]

            post = Post.objects.create(
                author_persona=author,
                title=title,
                description=content,
                broad_topic=broad_topic,
                narrow_topic=narrow_topic,
                likes_count=likes,
                clicks_count=clicks,
                impressions_count=impressions,
                embedding=dummy_embedding
            )
            
            # Create Interaction objects using bulk_create for performance
            interactions = []
            
            # Add Likes
            for _ in range(likes):
                interactions.append(Interaction(
                    persona=random.choice(personas),
                    post=post,
                    interaction_type=Interaction.LIKE
                ))
            
            # Add Clicks (excluding those who liked, just to match counts roughly)
            for _ in range(clicks - likes):
                interactions.append(Interaction(
                    persona=random.choice(personas),
                    post=post,
                    interaction_type=Interaction.CLICK
                ))
                
            # Add Impressions (excluding clicks)
            for _ in range(impressions - clicks):
                interactions.append(Interaction(
                    persona=random.choice(personas),
                    post=post,
                    interaction_type=Interaction.IMPRESSION
                ))
                
            Interaction.objects.bulk_create(interactions)
                
            # Generate random comments
            num_comments = random.randint(0, 20)
            comments = []
            for _ in range(num_comments):
                comments.append(Comment(
                    post=post,
                    persona=random.choice(personas),
                    content=f"This is a random comment {random.randint(1, 1000)}!"
                ))
            Comment.objects.bulk_create(comments)
            
            print(f"Created post '{title}' with {likes} likes, {clicks} clicks, {impressions} impressions, and {num_comments} comments.")

    print("Data loading complete.")

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python load_csv_data.py <userdata.csv> <post.csv>")
        print("Example: python load_csv_data.py ../userdata.csv ../posts.csv")
    else:
        load_data(sys.argv[1], sys.argv[2])
