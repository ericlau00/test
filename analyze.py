import sqlite3
from json import load, dump
from pprint import pprint 

# with open('domain_top_tmp.json') as f:
#     domains = load(f)

# with open('domain_top.json') as f:
#     match = load(f)

# for i in range(len(domains)):
#     for x in match:
#         if x['domain'] == domains[i]['domain']:
#             if 'label' in x:
#                 domains[i]['label'] = x['label']
#             else:
#                 domains[i]['label'] = domains[i]['domain'].capitalize()
#             if 'color' in x:
#                 domains[i]['color'] = x['color']
#             else: 
#                 domains[i]['color'] = 'gray'

# with open('domain_top_tmp.json', 'w') as f:
#     dump(domains, f, indent=2)

with open('domains.json', 'r') as f:
    dlist = load(f)

def fix_domain(row):
    domain = row[3]
    if domain is None:
        url = row[4]
        for d in dlist:
            if d in url:
                domain = dlist[d]
                return domain 
        # if domain is None:
        #     print(row)
    return domain
    
domains = dict()
# domain_set = set()

con = sqlite3.connect('History.db')

cur = con.cursor()

count = 0
g = set()
extra = list()
prev = tuple()

songs = list()

for row in cur.execute(
    """
        SELECT datetime(v.visit_time + 978307200, 'unixepoch', 'localtime') AS date, v.visit_time, v.title, i.domain_expansion, i.url, i.visit_count
        FROM history_items i LEFT JOIN history_visits v ON i.id = v.history_item
        WHERE date >= '2021-01-19 00:00:00'
        ORDER BY v.visit_time ASC;
    """
    ):
    domain = str()
    if len(prev) > 0:
        if row[1] - prev[1] < 0.5:
            continue 
        else:
            if row[2] == prev[2] and row[3] == prev[3] and row[4] == prev[4] and row[1] - prev[1] < 5:
                continue
            else:
                domain = fix_domain(row)
                domains[domain] = domains.get(domain, 0) + 1
                if domain == 'genius':
                    if row[2] in g:
                        songs.append({
                            'time': row[0],
                            'new': False,
                        })
                    else:
                        songs.append({
                            'time': row[0],
                            'new': True,
                            'title': row[2]
                        })
                    g.add(row[2])
                else:
                    # print(domain)
                    extra.append({
                        'time': row[0],
                        # 'url': row[4],
                        'domain': domain
                    })
                    count += 1
                    # songs.add(row[2])
                # domain_set.add(domain)
    else:
        domain = fix_domain(row)
        domains[domain] = domains.get(domain, 0) + 1
        if domain == 'genius':
            if row[2] in g:
                songs.append({
                    'time': row[0],
                    'new': False,
                })
            else:
                songs.append({
                    'time': row[0],
                    'new': True,
                    'title': row[2]
                })
            g.add(row[2])
        else:
            count += 1
            extra.append({
                'time': row[0],
                'domain': domain
            })
            # print(domain)
            # songs.add(row[2])
        # domain_set.add(domain)

    prev = row

other = 0
remove = list()
for domain in domains:
    if domains[domain] < 20:
        other += domains[domain]
        remove.append(domain)

for d in remove:
    domains.pop(d)

domains['other'] = domains.pop(None) + other

d = [{'domain': item[0], 'visits': item[1]} for item in domains.items()]
d = sorted(d, key=lambda item: item['visits'], reverse=True)

print(len(d), count)

# with open('domain_top_tmp.json', 'w') as f:
#     dump(d, f, indent=2)

# with open('extra.json', 'w') as f:
#     dump(extra, f, indent=2, ensure_ascii=False)