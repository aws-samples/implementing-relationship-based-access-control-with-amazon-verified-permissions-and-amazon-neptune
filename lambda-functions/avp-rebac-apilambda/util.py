import json


def debug_object(obj: object) -> None:
    print(json.dumps(obj, indent=2, default=str).replace("\n", "\r"))
