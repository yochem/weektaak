import csv
import json

from datetime import datetime
from pathlib import Path


def csv_to_json(csv_file_path, json_file_path):
    data = {}
    keys = ("kitchen-1", "kitchen-2", "kitchen-3", "toilets", "showers")

    with open(csv_file_path, "r") as csv_file:
        csv_reader = csv.reader(csv_file)

        # skip header line
        next(csv_reader)

        for row in csv_reader:
            start, _, *tasks = row
            start_date = datetime.strptime(start, "%d-%m-%Y").date().isoformat()
            data[start_date] = dict(zip(keys, tasks))

    with open(json_file_path, "w") as json_file:
        json.dump(data, json_file, separators=(",", ":"))


if __name__ == "__main__":
    csv_file_path = "data.csv"
    json_file_path = "public/tasks.json"
    csv_to_json(csv_file_path, json_file_path)
