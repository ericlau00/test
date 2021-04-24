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

for row in cur.execute(
    """
        SELECT datetime(v.visit_time + 978307200, 'unixepoch', 'localtime') AS date, v.visit_time, v.title, i.domain_expansion, i.url, i.visit_count
        FROM history_items i LEFT JOIN history_visits v ON i.id = v.history_item
        WHERE date BETWEEN '2021-01-18 00:00:00' AND '2021-01-30 00:00:00' 
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
                count += 1
                domains[domain] = domains.get(domain, 0) + 1
                print(row[3])
                # domain_set.add(domain)
    else:
        domain = fix_domain(row)
        count += 1
        domains[domain] = domains.get(domain, 0) + 1
        print(row[3])
        # domain_set.add(domain)

    prev = row

# pprint(sorted(domains.items(), key=lambda x:x[1]))
# 
domain_set = [item[0] for item in domains.items() if item[1] > 10]

with open('domain_set.json', 'w') as f:
    dump(domain_set, f, indent=2)