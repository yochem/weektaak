from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path
from typing import Iterator

import ics


@dataclass
class WeekCleaning:
    """
    One week of cleaning.

    Currently has three people for the kitchen, one for the toilets and one
    for the showers.
    """

    week_start: datetime
    kitchen: list[str]
    toilets: str
    showers: str

    def cleaners(self) -> list[str]:
        """Return a list of all names with a cleaning job of this week."""
        return self.kitchen + [self.toilets, self.showers]

    def __contains__(self, person: str) -> bool:
        """Return if a person's name is in the schedule for this week."""
        return person in self.cleaners()

    def __iter__(self) -> Iterator[str]:
        """Iterate over people's name in this week's cleaning."""
        for cleaner in self.cleaners():
            yield cleaner

    def jobname(self, person: str) -> str:
        """Given a person's name, return the Dutch job description."""
        labels = ["Keuken", "Keuken", "Keuken", "Wc's", "Douches"]
        return labels[self.cleaners().index(person)]

    def __str__(self) -> str:
        """Return string representation of this week's cleaning."""
        return "\n".join(
            [
                f"TAKEN WEEK {self.week_start.isocalendar().week}",
                "",
                "Keuken 🍳",
            ]
            + [f"- {name}" for name in self.kitchen]
            + ["", "Wc's 🚽", f"- {self.toilets}", "", "Douches 🚿", f"- {self.showers}"]
        )


Schedule = list[WeekCleaning]


def csv2schedule(path: str) -> Schedule:
    with open(path, "r") as f:
        lines = f.read().splitlines()

    weeks = [splitted for line in lines if all(splitted := line.split(","))]

    schedule = []

    for begin, _, *kitchen, toilets, showers in weeks:
        begin_date = datetime.strptime(begin, "%d-%m-%Y")
        schedule.append(WeekCleaning(begin_date, kitchen, toilets, showers))

    return schedule


def person_index(schedule: Schedule) -> dict[str, Schedule]:
    index: dict[str, Schedule] = {}

    for week in schedule:
        for person in week:
            index[person] = index.get(person, []) + [week]

    return index


def create_calendar(person: str, schedule: Schedule, filename: str = "{}.ics") -> None:
    cal = ics.Calendar()

    for week in schedule:
        event = ics.Event(
            transparent=True, description=str(week), last_modified=datetime.now()
        )
        event.name = f"Weektaak: {week.jobname(person)}"
        event.begin = week.week_start.isoformat(sep=" ")
        event.duration = timedelta(days=6)
        event.make_all_day()

        cal.events.add(event)

    with open(filename.format(person.lower()), "w") as f:
        f.writelines(cal.serialize_iter())


def cleanup(ics_dir: str) -> None:
    target_dir = Path(ics_dir)

    for file in target_dir.iterdir():
        file.unlink()


if __name__ == "__main__":
    cfg = {
        "ics_dir": "../cal",
        "data_path": "../data.csv",
    }

    cleanup(cfg['ics_dir'])

    schedule = csv2schedule(cfg["data_path"])
    index = person_index(schedule)

    for person, personal_schedule in index.items():
        create_calendar(person, personal_schedule, filename=cfg['ics_dir'] + "/{}.ics")
