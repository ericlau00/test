import sqlite3
from json import load, dump
from pprint import pprint 

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
prev = tuple()

songs = list()

for row in cur.execute(
    """
        SELECT datetime(v.visit_time + 978307200, 'unixepoch', 'localtime') AS date, v.visit_time, v.title, i.domain_expansion, i.url, i.visit_count
        FROM history_items i LEFT JOIN history_visits v ON i.id = v.history_item
        WHERE date BETWEEN '2021-02-03 23:00:00' AND '2021-02-04 11:00:00'
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
            count += 1
            # songs.add(row[2])
        # domain_set.add(domain)

    prev = row

other = 0
remove = list()
for domain in domains:
    if domains[domain] < 19:
        other += domains[domain]
        remove.append(domain)

for d in remove:
    domains.pop(d)

# domains['other'] = domains.pop(None) + other

d = [{'domain': item[0], 'visits': item[1]} for item in domains.items()]
d = sorted(d, key=lambda item: item['visits'], reverse=True)

print(len(d), count)

# with open('domain_top_tmp.json', 'w') as f:
#     dump(d, f, indent=2)

with open('genius.json', 'w') as f:
    dump(songs, f, indent=2, ensure_ascii=False)