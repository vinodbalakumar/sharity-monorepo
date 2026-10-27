"""Export only public listing facts for bounded AI retrieval; no accounts, orders or delivery secrets."""
import argparse
import datetime
import json
from pathlib import Path
import urllib.request

parser = argparse.ArgumentParser()
parser.add_argument('--origin', default='http://localhost:8080')
args = parser.parse_args()
deploy = Path(__file__).resolve().parents[2]
url = args.origin.rstrip('/') + '/bff/public/marketplace-service/api/v1/marketplace/listings'
with urllib.request.urlopen(url, timeout=30) as response:
    listings = json.load(response)
if not isinstance(listings, list) or not listings or len(listings) > 500:
    raise ValueError('Expected 1-500 public catalog entries; previous snapshot was preserved')
now = datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00', 'Z')
sources = []
for item in listings:
    if item.get('listingStatus') not in ('ACTIVE', 'PUBLISHED', 'SOLD'):
        continue
    # Explicit allowlist. Seller prose is excluded: the current demo catalog repeats an unrelated description.
    facts = {key: item.get(key) for key in ('publicId', 'title', 'categoryCode', 'verticalCode', 'priceAmount',
             'currencyCode', 'productType', 'deliveryType', 'listingStatus', 'demoSeed')}
    if not facts['publicId'] or not facts['title']:
        raise ValueError('Missing public listing identity')
    sources.append(dict(id='product-' + facts['publicId'], title=facts['title'],
        url='https://vinodbalakumar.com/app/', updatedAt=now, visibility='PUBLIC', approved=True,
        content='Public listing snapshot: ' + json.dumps(facts, ensure_ascii=True)
            + '. Sample/demo listings are not verified purchasable inventory. Recheck the listing for current price, stock and terms. '
            + 'No license validity, region, warranty, certification, material authenticity or fulfillment promise is verified.'))
target = deploy / 'knowledge' / 'catalog.json'
target.parent.mkdir(parents=True, exist_ok=True)
temporary = target.with_suffix('.tmp')
temporary.write_text(json.dumps(dict(generatedAt=now, sources=sources), indent=2), encoding='utf-8')
temporary.replace(target)
print('Refreshed {} public product records; snapshot expires after 24 hours.'.format(len(sources)))
