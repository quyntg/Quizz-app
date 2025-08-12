let ggApiUrl = "https://script.google.com/macros/s/AKfycbzuwW0Vgis5x3O-FYj2rd3uZqSkClIjgWfujgtekvjUiTdC6KBb45kLc5ODxtOg_Au6/exec";

let questions = [
	{
        "id": "Q1",
        "question": "2 × 1 = ?",
        "description": "2 x 1 = 2 vì lấy nhân với 1 bằng chính nó.",
        "options": [
            {
                "context": "2",
                "id": 1
            },
            {
                "context": "3",
                "id": 2
            },
            {
                "context": "4",
                "id": 3
            },
            {
                "context": "5",
                "id": 4
            }
        ],
        "correct": "1",
        "difficulty": "easy"
    },
    {
        "id": "Q2",
        "question": "2 × 2 = ?",
        "description": "2 x 2 = 4 vì lấy nhân với 2 bằng chính nó.",
        "options": [
            {
                "context": "4",
                "id": 1
            },
            {
                "context": "3",
                "id": 2
            },
            {
                "context": "5",
                "id": 3
            },
            {
                "context": "6",
                "id": 4
            }
        ],
        "correct": "1",
        "difficulty": "easy"
    },
    {
        "id": "Q3",
        "question": "2 × 3 = ?",
        "description": "",
        "options": [
            {
                "context": "5",
                "id": 1
            },
            {
                "context": "6",
                "id": 2
            },
            {
                "context": "7",
                "id": 3
            },
            {
                "context": "8",
                "id": 4
            }
        ],
        "correct": "2",
        "difficulty": "easy"
    },
    {
        "id": "Q4",
        "question": "2 × 4 = ?",
        "description": "",
        "options": [
            {
                "context": "6",
                "id": 1
            },
            {
                "context": "7",
                "id": 2
            },
            {
                "context": "8",
                "id": 3
            },
            {
                "context": "10",
                "id": 4
            }
        ],
        "correct": "3",
        "difficulty": "easy"
    },
    {
        "id": "Q5",
        "question": "2 × 5 = ?",
        "description": "",
        "options": [
            {
                "context": "10",
                "id": 1
            },
            {
                "context": "9",
                "id": 2
            },
            {
                "context": "11",
                "id": 3
            },
            {
                "context": "12",
                "id": 4
            }
        ],
        "correct": "1",
        "difficulty": "easy"
    },
    {
        "id": "Q6",
        "question": "2 × 6 = ?",
        "description": "",
        "options": [
            {
                "context": "11",
                "id": 1
            },
            {
                "context": "12",
                "id": 2
            },
            {
                "context": "10",
                "id": 3
            },
            {
                "context": "13",
                "id": 4
            }
        ],
        "correct": "2",
        "difficulty": "easy"
    },
    {
        "id": "Q7",
        "question": "2 × 7 = ?",
        "description": "",
        "options": [
            {
                "context": "13",
                "id": 1
            },
            {
                "context": "14",
                "id": 2
            },
            {
                "context": "15",
                "id": 3
            },
            {
                "context": "16",
                "id": 4
            }
        ],
        "correct": "2",
        "difficulty": "medium"
    },
    {
        "id": "Q8",
        "question": "2 × 8 = ?",
        "description": "",
        "options": [
            {
                "context": "15",
                "id": 1
            },
            {
                "context": "16",
                "id": 2
            },
            {
                "context": "17",
                "id": 3
            },
            {
                "context": "18",
                "id": 4
            }
        ],
        "correct": "2",
        "difficulty": "medium"
    },
    {
        "id": "Q9",
        "question": "2 × 9 = ?",
        "description": "",
        "options": [
            {
                "context": "18",
                "id": 1
            },
            {
                "context": "19",
                "id": 2
            },
            {
                "context": "17",
                "id": 3
            },
            {
                "context": "16",
                "id": 4
            }
        ],
        "correct": "1",
        "difficulty": "medium"
    },
    {
        "id": "Q9",
        "question": "2 × 10 = ?",
        "description": "",
        "options": [
            {
                "context": "20",
                "id": 1
            },
            {
                "context": "21",
                "id": 2
            },
            {
                "context": "22",
                "id": 3
            },
            {
                "context": "23",
                "id": 4
            }
        ],
        "correct": "1",
        "difficulty": "medium"
    },
	{
        "id": "Q11",
        "question": "3 × 1 = ?",
        "description": "",
        "options": [
            {
                "context": "3",
                "id": 1
            },
            {
                "context": "4",
                "id": 2
            },
            {
                "context": "5",
                "id": 3
            },
            {
                "context": "6",
                "id": 4
            }
        ],
        "correct": "1",
        "difficulty": "easy"
    },
    {
        "id": "Q12",
        "question": "3 × 2 = ?",
        "description": "",
        "options": [
            {
                "context": "6",
                "id": 1
            },
            {
                "context": "5",
                "id": 2
            },
            {
                "context": "7",
                "id": 3
            },
            {
                "context": "8",
                "id": 4
            }
        ],
        "correct": "1",
        "difficulty": "easy"
    },
    {
        "id": "Q13",
        "question": "3 × 3 = ?",
        "description": "",
        "options": [
            {
                "context": "9",
                "id": 1
            },
            {
                "context": "6",
                "id": 2
            },
            {
                "context": "8",
                "id": 3
            },
            {
                "context": "12",
                "id": 4
            }
        ],
        "correct": "1",
        "difficulty": "easy"
    },
    {
        "id": "Q14",
        "question": "3 × 4 = ?",
        "description": "",
        "options": [
            {
                "context": "12",
                "id": 1
            },
            {
                "context": "9",
                "id": 2
            },
            {
                "context": "11",
                "id": 3
            },
            {
                "context": "13",
                "id": 4
            }
        ],
        "correct": "1",
        "difficulty": "medium"
    },
    {
        "id": "Q15",
        "question": "3 × 5 = ?",
        "description": "",
        "options": [
            {
                "context": "15",
                "id": 1
            },
            {
                "context": "12",
                "id": 2
            },
            {
                "context": "16",
                "id": 3
            },
            {
                "context": "14",
                "id": 4
            }
        ],
        "correct": "1",
        "difficulty": "medium"
    },
    {
        "id": "Q16",
        "question": "3 × 6 = ?",
        "description": "",
        "options": [
            {
                "context": "18",
                "id": 1
            },
            {
                "context": "17",
                "id": 2
            },
            {
                "context": "16",
                "id": 3
            },
            {
                "context": "20",
                "id": 4
            }
        ],
        "correct": "1",
        "difficulty": "medium"
    },
    {
        "id": "Q17",
        "question": "3 × 7 = ?",
        "description": "",
        "options": [
            {
                "context": "21",
                "id": 1
            },
            {
                "context": "24",
                "id": 2
            },
            {
                "context": "20",
                "id": 3
            },
            {
                "context": "23",
                "id": 4
            }
        ],
        "correct": "1",
        "difficulty": "hard"
    },
    {
        "id": "Q18",
        "question": "3 × 8 = ?",
        "description": "",
        "options": [
            {
                "context": "24",
                "id": 1
            },
            {
                "context": "23",
                "id": 2
            },
            {
                "context": "25",
                "id": 3
            },
            {
                "context": "22",
                "id": 4
            }
        ],
        "correct": "1",
        "difficulty": "hard"
    },
    {
        "id": "Q19",
        "question": "3 × 9 = ?",
        "description": "",
        "options": [
            {
                "context": "27",
                "id": 1
            },
            {
                "context": "26",
                "id": 2
            },
            {
                "context": "28",
                "id": 3
            },
            {
                "context": "25",
                "id": 4
            }
        ],
        "correct": "1",
        "difficulty": "hard"
    },
    {
        "id": "Q20",
        "question": "3 × 10 = ?",
        "description": "",
        "options": [
            {
                "context": "30",
                "id": 1
            },
            {
                "context": "28",
                "id": 2
            },
            {
                "context": "32",
                "id": 3
            },
            {
                "context": "29",
                "id": 4
            }
        ],
        "correct": "1",
        "difficulty": "hard"
    },
    {
        "id": "Q21",
        "question": "4 × 1 = ?",
        "description": "",
        "options": [
            {
                "context": "4",
                "id": 1
            },
            {
                "context": "5",
                "id": 2
            },
            {
                "context": "6",
                "id": 3
            },
            {
                "context": "3",
                "id": 4
            }
        ],
        "correct": "1",
        "difficulty": "easy"
    },
    {
        "id": "Q22",
        "question": "4 × 2 = ?",
        "description": "",
        "options": [
            {
                "context": "8",
                "id": 1
            },
            {
                "context": "7",
                "id": 2
            },
            {
                "context": "9",
                "id": 3
            },
            {
                "context": "10",
                "id": 4
            }
        ],
        "correct": "1",
        "difficulty": "easy"
    },
    {
        "id": "Q23",
        "question": "4 × 3 = ?",
        "description": "",
        "options": [
            {
                "context": "12",
                "id": 1
            },
            {
                "context": "11",
                "id": 2
            },
            {
                "context": "14",
                "id": 3
            },
            {
                "context": "10",
                "id": 4
            }
        ],
        "correct": "1",
        "difficulty": "easy"
    },
    {
        "id": "Q24",
        "question": "4 × 4 = ?",
        "description": "",
        "options": [
            {
                "context": "16",
                "id": 1
            },
            {
                "context": "12",
                "id": 2
            },
            {
                "context": "18",
                "id": 3
            },
            {
                "context": "14",
                "id": 4
            }
        ],
        "correct": "1",
        "difficulty": "medium"
    },
    {
        "id": "Q25",
        "question": "4 × 5 = ?",
        "description": "",
        "options": [
            {
                "context": "20",
                "id": 1
            },
            {
                "context": "24",
                "id": 2
            },
            {
                "context": "18",
                "id": 3
            },
            {
                "context": "22",
                "id": 4
            }
        ],
        "correct": "1",
        "difficulty": "medium"
    },
    {
        "id": "Q26",
        "question": "4 × 6 = ?",
        "description": "",
        "options": [
            {
                "context": "24",
                "id": 1
            },
            {
                "context": "20",
                "id": 2
            },
            {
                "context": "26",
                "id": 3
            },
            {
                "context": "22",
                "id": 4
            }
        ],
        "correct": "1",
        "difficulty": "medium"
    },
    {
        "id": "Q27",
        "question": "4 × 7 = ?",
        "description": "",
        "options": [
            {
                "context": "28",
                "id": 1
            },
            {
                "context": "27",
                "id": 2
            },
            {
                "context": "26",
                "id": 3
            },
            {
                "context": "30",
                "id": 4
            }
        ],
        "correct": "1",
        "difficulty": "hard"
    },
    {
        "id": "Q28",
        "question": "4 × 8 = ?",
        "description": "",
        "options": [
            {
                "context": "32",
                "id": 1
            },
            {
                "context": "34",
                "id": 2
            },
            {
                "context": "30",
                "id": 3
            },
            {
                "context": "36",
                "id": 4
            }
        ],
        "correct": "1",
        "difficulty": "hard"
    },
    {
        "id": "Q29",
        "question": "4 × 9 = ?",
        "description": "",
        "options": [
            {
                "context": "36",
                "id": 1
            },
            {
                "context": "34",
                "id": 2
            },
            {
                "context": "32",
                "id": 3
            },
            {
                "context": "38",
                "id": 4
            }
        ],
        "correct": "1",
        "difficulty": "hard"
    },
    {
        "id": "Q30",
        "question": "4 × 10 = ?",
        "description": "",
        "options": [
            {
                "context": "40",
                "id": 1
            },
            {
                "context": "38",
                "id": 2
            },
            {
                "context": "42",
                "id": 3
            },
            {
                "context": "36",
                "id": 4
            }
        ],
        "correct": "1",
        "difficulty": "hard"
    },
    {
        "id": "Q31",
        "question": "5 × 1 = ?",
        "description": "",
        "options": [
            {
                "context": "5",
                "id": 1
            },
            {
                "context": "4",
                "id": 2
            },
            {
                "context": "6",
                "id": 3
            },
            {
                "context": "7",
                "id": 4
            }
        ],
        "correct": "1",
        "difficulty": "easy"
    },
    {
        "id": "Q32",
        "question": "5 × 2 = ?",
        "description": "",
        "options": [
            {
                "context": "10",
                "id": 1
            },
            {
                "context": "12",
                "id": 2
            },
            {
                "context": "8",
                "id": 3
            },
            {
                "context": "15",
                "id": 4
            }
        ],
        "correct": "1",
        "difficulty": "easy"
    },
    {
        "id": "Q33",
        "question": "5 × 3 = ?",
        "description": "",
        "options": [
            {
                "context": "15",
                "id": 1
            },
            {
                "context": "10",
                "id": 2
            },
            {
                "context": "13",
                "id": 3
            },
            {
                "context": "17",
                "id": 4
            }
        ],
        "correct": "1",
        "difficulty": "easy"
    },
    {
        "id": "Q34",
        "question": "5 × 4 = ?",
        "description": "",
        "options": [
            {
                "context": "20",
                "id": 1
            },
            {
                "context": "22",
                "id": 2
            },
            {
                "context": "18",
                "id": 3
            },
            {
                "context": "25",
                "id": 4
            }
        ],
        "correct": "1",
        "difficulty": "medium"
    },
    {
        "id": "Q35",
        "question": "5 × 5 = ?",
        "description": "",
        "options": [
            {
                "context": "25",
                "id": 1
            },
            {
                "context": "20",
                "id": 2
            },
            {
                "context": "30",
                "id": 3
            },
            {
                "context": "28",
                "id": 4
            }
        ],
        "correct": "1",
        "difficulty": "medium"
    },
    {
        "id": "Q36",
        "question": "5 × 6 = ?",
        "description": "",
        "options": [
            {
                "context": "30",
                "id": 1
            },
            {
                "context": "35",
                "id": 2
            },
            {
                "context": "28",
                "id": 3
            },
            {
                "context": "26",
                "id": 4
            }
        ],
        "correct": "1",
        "difficulty": "medium"
    },
    {
        "id": "Q37",
        "question": "5 × 7 = ?",
        "description": "",
        "options": [
            {
                "context": "35",
                "id": 1
            },
            {
                "context": "30",
                "id": 2
            },
            {
                "context": "38",
                "id": 3
            },
            {
                "context": "40",
                "id": 4
            }
        ],
        "correct": "1",
        "difficulty": "hard"
    },
    {
        "id": "Q38",
        "question": "5 × 8 = ?",
        "description": "",
        "options": [
            {
                "context": "40",
                "id": 1
            },
            {
                "context": "45",
                "id": 2
            },
            {
                "context": "38",
                "id": 3
            },
            {
                "context": "43",
                "id": 4
            }
        ],
        "correct": "1",
        "difficulty": "hard"
    },
    {
        "id": "Q39",
        "question": "5 × 9 = ?",
        "description": "",
        "options": [
            {
                "context": "45",
                "id": 1
            },
            {
                "context": "50",
                "id": 2
            },
            {
                "context": "48",
                "id": 3
            },
            {
                "context": "43",
                "id": 4
            }
        ],
        "correct": "1",
        "difficulty": "hard"
    },
    {
        "id": "Q40",
        "question": "5 × 10 = ?",
        "description": "",
        "options": [
            {
                "context": "50",
                "id": 1
            },
            {
                "context": "55",
                "id": 2
            },
            {
                "context": "45",
                "id": 3
            },
            {
                "context": "48",
                "id": 4
            }
        ],
        "correct": "1",
        "difficulty": "hard"
    }
]

let subjects = [
    {
		"value": "all",
		"text": "Tổng hợp"
	},
    {
		"value": "math",
		"text": "Toán học"
	},
	{
		"value": "vietnamese",
		"text": "Tiếng Việt"
	},
	{
		"value": "literature",
		"text": "Ngữ văn"
	},
	{
		"value": "physics",
		"text": "Vật lý"
	},
	{
		"value": "chemistry",
		"text": "Hóa học"
	},
	{
		"value": "biology",
		"text": "Sinh học"
	},
	{
		"value": "history",
		"text": "Lịch sử"
	},
	{
		"value": "geography",
		"text": "Địa lý"
	},
	{
		"value": "civic_education",
		"text": "Giáo dục công dân"
	},
	{
		"value": "english",
		"text": "Tiếng Anh"
	},
	{
		"value": "technology",
		"text": "Công nghệ"
	},
	{
		"value": "informatics",
		"text": "Tin học"
	},
	{
		"value": "physical_education",
		"text": "Thể dục"
	},
	{
		"value": "national_defense",
		"text": "Giáo dục quốc phòng và an ninh"
	},
	{
		"value": "art",
		"text": "Nghệ thuật"
	},
	{
		"value": "moral_education",
		"text": "Đạo đức"
	},
	{
		"value": "science",
		"text": "Khoa học"
	},
	{
		"value": "local_education",
		"text": "Giáo dục địa phương"
	},
	{
		"value": "experiential_activities",
		"text": "Hoạt động trải nghiệm"
	},
	{
		"value": "career_orientation",
		"text": "Hướng nghiệp"
	}
]