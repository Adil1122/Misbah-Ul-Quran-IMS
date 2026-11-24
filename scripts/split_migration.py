#!/usr/bin/env python3
import os

with open("supabase/clean_production_migration.sql", "r", encoding="utf-8") as f:
    text = f.read()

# Split points
# Part 1: from start up to before "-- 5. STUDENTS"
p1_end = text.index("-- 5. STUDENTS")
part1 = text[:p1_end].strip()

# Part 2: from "-- 5. STUDENTS" up to before "-- 6. PAYMENT INVOICES"
p2_end = text.index("-- 6. PAYMENT INVOICES")
part2 = text[p1_end:p2_end].strip()

# Part 3: from "-- 6. PAYMENT INVOICES" up to before "-- 8. INCIDENT LOGS"
p3_end = text.index("-- 8. INCIDENT LOGS")
part3 = text[p2_end:p3_end].strip()

# Part 4: from "-- 8. INCIDENT LOGS" to the end
part4 = text[p3_end:].strip()

os.makedirs("supabase/migrations", exist_ok=True)
with open("supabase/migrations/01_schema_and_staff.sql", "w", encoding="utf-8") as f:
    f.write(part1)

with open("supabase/migrations/02_students.sql", "w", encoding="utf-8") as f:
    f.write(part2)

with open("supabase/migrations/03_invoices_and_timings.sql", "w", encoding="utf-8") as f:
    f.write(part3)

with open("supabase/migrations/04_media_and_permissions.sql", "w", encoding="utf-8") as f:
    f.write(part4)

print("Part 1 lines:", len(part1.splitlines()), "bytes:", len(part1))
print("Part 2 lines:", len(part2.splitlines()), "bytes:", len(part2))
print("Part 3 lines:", len(part3.splitlines()), "bytes:", len(part3))
print("Part 4 lines:", len(part4.splitlines()), "bytes:", len(part4))
