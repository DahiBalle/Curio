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
    # ── 1. USERS & PERSONAS ──────────────────────────────────────────────────
    print("Loading users and personas...")
    personas = []

    with open(userdata_csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        raw_headers = reader.fieldnames
        reader.fieldnames = [clean_key(h) for h in raw_headers]
        print(f"  User CSV headers (normalised): {reader.fieldnames}")

        skipped        = 0
        created_count  = 0
        already_exists = 0
        errored        = 0

        for row in reader:
            username = row.get('username', '').strip()
            name     = row.get('name', '').strip()
            bio      = row.get('user bio', '').strip()

            if not username or not name:
                skipped += 1
                if skipped <= 3:
                    print(f"  [SKIP-USERROW] username={repr(username)} name={repr(name)} keys={list(row.keys())[:6]}")
                continue

            # Sanitize username: Django only allows letters, digits, and @/./+/-/_
            import re
            safe_username = re.sub(r'[^\w.@+-]', '_', username)[:150]

            if User.objects.filter(username=safe_username).exists():
                already_exists += 1
                # Still need their persona for post authoring
                existing_persona = Persona.objects.filter(user__username=safe_username).first()
                if existing_persona:
                    personas.append(existing_persona)
                continue

            try:
                email = f"{safe_username}@example.com"
                user = User.objects.create(username=safe_username, email=email)
                user.set_password('password123')
                user.save()
                persona = Persona.objects.create(user=user, name=name, bio=bio)
                user.default_persona = persona
                user.save(update_fields=['default_persona'])
                personas.append(persona)
                created_count += 1
            except Exception as e:
                errored += 1
                print(f"  [ERROR] Could not create user {repr(safe_username)}: {e}")
                continue

    print(f"  Users created: {created_count} | Already existed: {already_exists} | Skipped (bad row): {skipped} | Errors: {errored} | Total personas available: {len(personas)}")

    if not personas:
        print("ERROR: No personas loaded. Cannot create posts. Check your user CSV column names.")
        return

    # ── 2. POSTS ─────────────────────────────────────────────────────────────
    print("\nLoading posts...")
    post_count   = 0
    post_skipped = 0
    POST_LIMIT   = 125_000

    with open(post_csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        raw_headers = reader.fieldnames
        reader.fieldnames = [clean_key(h) for h in raw_headers]
        print(f"  Post CSV headers (normalised): {reader.fieldnames}")

        topic_cache = {}   # name → Topic object, avoids repeated DB hits

        for row in reader:
            if post_count >= POST_LIMIT:
                print(f"  Reached {POST_LIMIT} post limit.")
                break

            title            = (row.get('title') or '').strip()
            content          = (row.get('selftext') or '').strip()
            broad_topic_name = (row.get('category_1') or 'General').strip()
            narrow_topic_name= (row.get('category_2') or 'General').strip()

            if not title or not content:
                post_skipped += 1
                if post_skipped <= 3:
                    print(f"  [SKIP-POSTROW] title={repr(title[:40])} content={repr(content[:40])}")
                continue

            # Topic — use cache to avoid hammering DB
            broad_key = ('broad', broad_topic_name)
            if broad_key not in topic_cache:
                bt, _ = Topic.objects.get_or_create(name=broad_topic_name, topic_type=Topic.BROAD)
                topic_cache[broad_key] = bt
            broad_topic = topic_cache[broad_key]

            narrow_key = ('narrow', narrow_topic_name)
            if narrow_key not in topic_cache:
                nt, _ = Topic.objects.get_or_create(
                    name=narrow_topic_name,
                    topic_type=Topic.NARROW,
                    defaults={'parent': broad_topic}
                )
                topic_cache[narrow_key] = nt
            narrow_topic = topic_cache[narrow_key]

            author = random.choice(personas)

            # Keep interaction counts small to save storage
            likes       = random.randint(0, 5)
            clicks      = random.randint(likes, likes + 20)
            impressions = random.randint(clicks, clicks + 50)

            try:
                post = Post.objects.create(
                    author_persona   = author,
                    title            = title,
                    description      = content,
                    broad_topic      = broad_topic,
                    narrow_topic     = narrow_topic,
                    likes_count      = likes,
                    clicks_count     = clicks,
                    impressions_count= impressions,
                    # embedding left NULL intentionally
                )
                post_count += 1
            except Exception as e:
                print(f"  [ERROR] Could not create post {repr(title[:40])}: {e}")
                continue

            # Only create LIKE interaction rows (smallest footprint)
            if likes > 0:
                like_records = [
                    Interaction(
                        persona          = random.choice(personas),
                        post             = post,
                        interaction_type = Interaction.LIKE,
                    )
                    for _ in range(likes)
                ]
                Interaction.objects.bulk_create(like_records)

            if post_count % 1000 == 0:
                print(f"  {post_count} posts inserted...")

    print(f"\nDone. Posts created: {post_count} | Posts skipped: {post_skipped}")
    print("Data loading complete.")


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python load_csv_data.py <userdata.csv> <post.csv>")
        print("Example: python load_csv_data.py users.csv posts.csv")
    else:
        load_data(sys.argv[1], sys.argv[2])
