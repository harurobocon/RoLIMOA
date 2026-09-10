from tweet_formatter import format_tweet

def test_user_example():
    sample_payload = {
        "match": {
            "name": "予選第20試合",
            "teams": {
                "red": {
                    "school": "豊田工業高等専門学校",
                    "name": "とよたし♡ロボコンブ",
                    "shortName": "豊田高専",
                },
                "blue": {
                    "school": "東京大学",
                    "name": "The Canon",
                    "shortName": "東大",
                },
            },
        },
        "finalScore": {
            "fields": {
                "red": {"enable": True, "winner": False, "vgoal": None, "tasks": {}},
                "blue": {"enable": True, "winner": True, "vgoal": 15, "tasks": {}},
            },
        },
        "confirmedScore": {
            "red": 0,
            "blue": 15,
        },
        "comment": "素早い回収と6連続の投擲により「ファンファーレ」を達成しました！",
    }

    tweet = format_tweet(sample_payload, default_hashtags="#関東春ロボコン #春ロボコン")
    expected = "\n".join([
        "予選第20試合",
        "豊田工業高等専門学校「とよたし♡ロボコンブ」VS 東京大学「The Canon」",
        "0 - Vゴール 15秒",
        "でThe Canonの勝利です！",
        "素早い回収と6連続の投擲により「ファンファーレ」を達成しました！",
        "#関東春ロボコン #春ロボコン",
    ])
    print("Result:\n", tweet)
    print("Expected:\n", expected)
    assert tweet == expected, f"Mismatch!\nGot:\n{tweet}\nExpected:\n{expected}"
    print("test_user_example: PASSED\n")


def test_user_new_example():
    sample_payload = {
        "match": {
            "name": "予選第3試合",
            "teams": {
                "red": {
                    "school": "国際信州大",
                    "name": "触手もぐもぐ",
                },
                "blue": {
                    "school": "国際信州大",
                    "name": "白米ぬるぬる",
                },
            },
        },
        "finalScore": {
            "fields": {
                "red": {"enable": True, "winner": False, "vgoal": None},
                "blue": {"enable": True, "winner": True, "vgoal": 10},
            },
        },
        "confirmedScore": {
            "red": 0,
            "blue": 10,
        },
        "comment": "すごい",
    }

    tweet = format_tweet(sample_payload, default_hashtags="#関東夏ロボコン #夏ロボコン")
    expected = "\n".join([
        "予選第3試合",
        "国際信州大「触手もぐもぐ」VS 国際信州大「白米ぬるぬる」",
        "0 - Vゴール 10秒",
        "で白米ぬるぬるの勝利です！",
        "すごい",
        "#関東夏ロボコン #夏ロボコン",
    ])
    print("Result:\n", tweet)
    print("Expected:\n", expected)
    assert tweet == expected, f"Mismatch!\nGot:\n{tweet}\nExpected:\n{expected}"
    print("test_user_new_example: PASSED\n")


def test_normal_score_no_comment():
    sample_payload = {
        "match": {
            "name": "決勝トーナメント第1試合",
            "teams": {
                "red": {
                    "school": "東京大学",
                    "name": "The Canon",
                },
                "blue": {
                    "school": "工学院大学",
                    "name": "K-Craft",
                },
            },
        },
        "finalScore": {
            "fields": {
                "red": {"enable": True, "winner": True, "vgoal": None},
                "blue": {"enable": True, "winner": False, "vgoal": None},
            },
        },
        "confirmedScore": {
            "red": 120,
            "blue": 80,
        },
        "comment": "",
    }

    tweet = format_tweet(sample_payload, default_hashtags="#関東夏ロボコン #夏ロボコン")
    expected = "\n".join([
        "決勝トーナメント第1試合",
        "東京大学「The Canon」VS 工学院大学「K-Craft」",
        "120 - 80",
        "でThe Canonの勝利です！",
        "#関東夏ロボコン #夏ロボコン",
    ])
    print("Result:\n", tweet)
    print("Expected:\n", expected)
    assert tweet == expected, f"Mismatch!\nGot:\n{tweet}\nExpected:\n{expected}"
    print("test_normal_score_no_comment: PASSED\n")


if __name__ == "__main__":
    test_user_example()
    test_user_new_example()
    test_normal_score_no_comment()
    print("All tests passed successfully!")
