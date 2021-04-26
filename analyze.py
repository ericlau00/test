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

with open('domain_top.json') as f:
    ds = load(f)

dmap = dict()
for d in ds:
    dmap[d['domain']] = d['color']

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

con = sqlite3.connect('History.db')

cur = con.cursor()

count = 0
x = list()
prev = tuple()

for row in cur.execute(
    """
        SELECT datetime(v.visit_time + 978307200, 'unixepoch', 'localtime') AS date, v.visit_time, v.title, i.domain_expansion, i.url, i.visit_count
        FROM history_items i LEFT JOIN history_visits v ON i.id = v.history_item
        WHERE date BETWEEN '2021-04-15 13:00:00' AND '2021-04-16 00:00:00'
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
                count += 1
                color = dmap[domain] if domain in dmap else 'gray'
                x.append({
                    'time': row[0],
                    'domain': domain,
                    'color': color
                })
                # if domain == 'google':
                print(row)
    else:
        domain = fix_domain(row)
        domains[domain] = domains.get(domain, 0) + 1
        count += 1
        color = dmap[domain] if domain in dmap else 'gray'
        x.append({
            'time': row[0],
            'domain': domain,
            'color': color
        })
        # if domain == 'google':
        print(row)
    prev = row

# other = 0
# remove = list()
# for domain in domains:
    # if domains[domain] < 20:
        # other += domains[domain]
        # remove.append(domain)

# for d in remove:
    # domains.pop(d)

# domains['other'] = domains.pop(None) + other

# d = [{'domain': item[0], 'visits': item[1]} for item in domains.items()]
# d = sorted(d, key=lambda item: item['visits'], reverse=True)

# print(len(d), count)

# with open('test.json', 'w') as f:
#     dump(x, f, indent=2)