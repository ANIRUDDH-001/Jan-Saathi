import os
import cohere
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('pipeline/.env')
sb = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))
co = cohere.Client(os.getenv('COHERE_API_KEY'))

queries = ['pension scheme farmer 60 years old', 'UP kisan income support 6000 fasal']

for q in queries:
    emb = co.embed(texts=[q], model='embed-multilingual-v3.0', input_type='search_query', embedding_types=['float']).embeddings.float[0]
    res = sb.rpc('match_schemes', {'query_embedding': emb, 'match_threshold': 0, 'match_count': 5}).execute()
    print(f"\nQuery: {q}")
    for row in res.data:
        # Some rows might not have similarity if RPC doesn't return it
        print(f" - {row.get('acronym', row.get('name_english'))} | Sim: {row.get('similarity', 'N/A')}")
