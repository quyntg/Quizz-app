let current = 0;
const pageSize = 40;
let currentPage = 0;
let generatedQuestions = [];
let totalQuestions = 0;
let totalPages = 0;
let timerDuration = 0; // 30 phút = 1800 giây
let timerInterval;
let isSubmitted = localStorage.getItem('isSubmitted') === 'true';
let totalTimeSpent = 0; // giây
let timerStartAt = null;

function startExam() {
	localStorage.removeItem('studentInfo');
	localStorage.setItem('isStudentDoing', '0');
	window.location.href = 'exam.html';
	initNav(); // Hiển thị trước nav
	showQuestion(0); // Hiển thị ô đầu
	loadQuestions(); // Lấy dữ liệu
}

function generateExamFromQuestions(allQuestions, total, form, examType) {
	// Nếu là tự luận thì chỉ lấy đúng số lượng, không xử lý logic trắc nghiệm
	// Trắc nghiệm hoặc mix: giữ logic cũ
	const easyCount = form[examType]?.easy || 0;
	const mediumCount = form[examType]?.medium || 0;
	const hardCount = form[examType]?.hard || 0;
	const easy = allQuestions.filter(q => q.difficulty === 'easy');
	const medium = allQuestions.filter(q => q.difficulty === 'medium');
	const hard = allQuestions.filter(q => q.difficulty === 'hard');	
	
	if (easy.length < easyCount || medium.length < mediumCount || hard.length < hardCount) {
		alert("❌ Không đủ câu hỏi theo từng mức độ yêu cầu.");
		return;
	} else {        
		if (localStorage.getItem('isStudent') == '1') {
			// ...existing code...
		} else {
			window.location.href = 'load.html';
		}
	}

	if (examType === 'essay' || examType === 'tự luận') {
		// Chỉ lấy đúng số lượng câu tự luận
		let exam = allQuestions.filter(q => q.type === 'essay' || q.type === 'tự luận').slice(0, total);
		return exam;
	}

	if (examType === 'quiz' || examType === 'Trắc nghiệm') {
		// Đề quiz: chỉ lấy đúng số lượng câu trắc nghiệm
		let quizQuestions = allQuestions.filter(q => q.type === 'quiz' || q.type === 'Trắc nghiệm');
		let quizShuffled = shuffleArray(quizQuestions);
		let exam = quizShuffled.slice(0, total);
		return exam;
	}

	if (examType === 'mix') {
		// Đề mix: quiz trên, essay dưới
		const quizQuestions = allQuestions.filter(q => q.type === 'quiz' || q.type === 'Trắc nghiệm');
		const essayQuestions = allQuestions.filter(q => q.type === 'essay' || q.type === 'tự luận');
		// Trộn quiz và essay riêng biệt
		const quizShuffled = shuffleArray(quizQuestions);
		const essayShuffled = shuffleArray(essayQuestions);
		// Ghép quiz trước, essay sau, lấy đủ số lượng
		let exam = [...quizShuffled, ...essayShuffled].slice(0, total);
		return exam;
	}

	function pickRandom(arr, n) {
		const copy = [...arr];
		const result = [];
		while (result.length < n && copy.length > 0) {
			const idx = Math.floor(Math.random() * copy.length);
			result.push(copy.splice(idx, 1)[0]);
		}
		return result;
	}

	const selectedEasy = pickRandom(easy, easyCount);
	const selectedMedium = pickRandom(medium, mediumCount);
	const selectedHard = pickRandom(hard, hardCount);

	let exam = [...selectedEasy, ...selectedMedium, ...selectedHard];

	// 🔄 Trộn câu hỏi
	exam = shuffleArray(exam);
    
	// 🔄 Trộn đáp án từng câu
	exam = exam.map((q) => {
		const options = shuffleArray(q.options); // Trộn mảng đáp án
		let oldCorrectId = q.correct ? parseInt(q.correct) : null;
		// Xác định đáp án đúng mới dựa vào nội dung đáp án đúng (q.correct là context)
		let correctOption = q.options.find(opt => String(opt.context).trim().toLowerCase() === String(q.correct).trim().toLowerCase());
		let newCorrect = "";
		if (correctOption) {
			newCorrect = options.findIndex(opt => String(opt.context).trim().toLowerCase() === String(q.correct).trim().toLowerCase()) + 1;
		}
		return {
			...q,
			options: options.map((opt, idx) => ({ ...opt, id: idx + 1 })),
			correct: newCorrect ? newCorrect.toString() : ""
		};
	});
    
	return exam.slice(0, total);
}

// Trộn mảng (Fisher–Yates)
function shuffleArray(arr) {
	const array = [...arr];
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j] ] = [array[j], array[i]];
	}
	return array;
}


function readFile(file) {
	const reader = new FileReader();

	reader.onload = function(e) {
		const data = new Uint8Array(e.target.result);
		const workbook = XLSX.read(data, { type: 'array' });

		const sheetName = workbook.SheetNames[0];
		const sheet = workbook.Sheets[sheetName];

		const raw = XLSX.utils.sheet_to_json(sheet);

		const questions = raw.map((row, index) => {
            // Xử lý correctId (vị trí đáp án đúng, 1-4)
            let correctId = row.correctId ? parseInt(row.correctId) : null;
            // Nếu không có correctId, fallback sang so sánh nội dung (giữ logic cũ cho an toàn)
            if (!correctId && row.correct) {
                if (row.A == row.correct) correctId = 1;
                else if (row.B == row.correct) correctId = 2;
                else if (row.C == row.correct) correctId = 3;
                else if (row.D == row.correct) correctId = 4;
            }
            // Nếu vẫn không xác định được thì để null

            // Xử lý difficulty
            let difficulty = "";
            if (row.difficulty === "dễ") {
                difficulty = "easy";
            } else if (row.difficulty === "trung bình" || row.difficulty === "Trung bình") {
                difficulty = "medium";
            } else if (row.difficulty === "khó") {
                difficulty = "hard";
            }
			
			return {
				id: row.id || `Q${index + 1}`,
				question: row.question || "",
				media: row.media || "",
				subject: row.subject || "",
				type: row.type || "",
				grade: row.grade || "",
				options: [
					{ context: row.A || "", id: 1 },
					{ context: row.B || "", id: 2 },
					{ context: row.C || "", id: 3 },
					{ context: row.D || "", id: 4 }
				],
				correct: row.correct,
				description: row.description || "",
				difficulty,
				note: row.note || "",
			};
		});
		
		if (questions.length < localStorage.getItem('totalQuestions')) {
			alert(`❌ Số lượng câu hỏi của đề (${localStorage.getItem('totalQuestions')}) vượt quá giới hạn tối đa (${questions.length})`);
			return;
		} else {
			localStorage.setItem('questions', JSON.stringify(questions));
			const allQuestions = JSON.parse(localStorage.getItem('questions')) || [];
			const total = parseInt(localStorage.getItem('totalQuestions')) || 40;
			const examType = localStorage.getItem('examType') || 'quiz';
			const form = JSON.parse(localStorage.getItem('form') || '{}');
			let generatedQuestions = generateExamFromQuestions(allQuestions, total, form, examType);
			localStorage.setItem('questions', JSON.stringify(generatedQuestions));                        
			localStorage.setItem('isNewExam', 1);                    
			localStorage.setItem('examId', '');
		}
	};

	reader.readAsArrayBuffer(file);
}

function startCountdown(seconds = timerDuration) {
	timerStartAt = Date.now(); // Ghi lại thời điểm bắt đầu
	let timeLeft = seconds;
	updateTimerDisplay(timeLeft);
    
	timerInterval = setInterval(() => {
		timeLeft--;
		updateTimerDisplay(timeLeft);

		if (timeLeft <= 0) {
			clearInterval(timerInterval);
			showTimeoutModal();
		}
	}, 1000);
}

function showTimeoutModal() {
	const modal = document.getElementById('timeoutModal');
	modal.classList.remove('hidden');
	document.getElementById('timeoutOk').onclick = function() {
		modal.classList.add('hidden');
		submitExam(1);
	};
}

function updateTimerDisplay(seconds) {
	let display;
	if (seconds < 0) {
		display = "00:00";
	} else {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		display = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}
	document.getElementById("timerDisplay").innerText = display;
}

// Tạo nav 40 ô câu hỏi
function initNav() {
	const nav = document.getElementById('questionNav');
	nav.innerHTML = '';

	for (let i = 1; i <= totalQuestions; i++) {
		const li = document.createElement('li');
		li.textContent = i;
		li.addEventListener('click', () => showQuestion(i - 1));
		nav.appendChild(li);
	}
	renderPage();
	document.getElementById('totalLength').innerText = totalQuestions;
}

// Đánh dấu ô đang active
function highlightNav(idx) {
	document.querySelectorAll('#questionNav li').forEach((li, i) => {
		li.classList.toggle('active', i === idx);
	});
}

// Hiển thị đúng 10 ô của trang hiện tại
function renderPage() {
	const items = document.querySelectorAll('#questionNav li');
	items.forEach((li, i) => {
		const pageIndex = Math.floor(i / pageSize);
		li.style.display = (pageIndex === currentPage) ? 'flex' : 'none';
	});
	// cập nhật nút phân trang
	document.getElementById('prevPage').disabled = currentPage === 0;
	document.getElementById('nextPage').disabled = currentPage >= totalPages - 1;
	document.getElementById('pageInfo').innerText = `${currentPage + 1} / ${totalPages}`;
}

// Hiển thị câu hỏi tại vị trí idx
function showQuestion(idx) {
	current = idx;
	const q = generatedQuestions[idx] || {
		question: 'Chưa có dữ liệu',
		options: [],
		correct: '-'
	};
	const options = Array.isArray(q.options) ? q.options : [];

	// Tiêu đề câu hỏi: "Câu hỏi x: ..."
	const questionTitle = document.getElementById('viewQuestion');
	questionTitle.innerHTML = `Câu hỏi ${idx + 1}:<span class="question-title"> ${q.question}</span>`;

	// Hiển thị số thứ tự
	document.getElementById('currentIndex').innerText = idx + 1;


	// Nếu là câu tự luận thì sinh textarea nhập đáp án
	const opts = document.getElementById('viewOptions');
	opts.innerHTML = '';
	
	if (q.type === 'essay' || q.type === 'tự luận') {
		// Tự luận: giữ nguyên logic
		const textarea = document.createElement('textarea');
		textarea.id = 'essayAnswer';
		textarea.placeholder = 'Nhập câu trả lời...';
		textarea.style.width = '100%';
		textarea.style.minHeight = '300px';
		textarea.value = q.userAnswer || '';
		textarea.disabled = isSubmitted;
		textarea.addEventListener('input', function() {
			generatedQuestions[idx].userAnswer = textarea.value;
			updateAnsweredNav();
		});
		opts.appendChild(textarea);
		if (isSubmitted && q.description) {
			const desc = document.createElement('div');
			desc.className = 'explanation';
			desc.innerHTML = `<strong>Giải thích:</strong> ${q.description}`;
			opts.appendChild(desc);
		}
	} else if (q.type === 'quiz' || q.type === 'Trắc nghiệm' || localStorage.getItem('examType') === 'mix') {
		// Trắc nghiệm hoặc đề mix: hiển thị đáp án đúng/sai/chưa làm, luôn giữ selected cho đáp án đã chọn
		['A', 'B', 'C', 'D'].forEach((label, i) => {
			const option = options[i] || { context: '', id: null };
			const li = document.createElement('li');
			li.innerHTML = `<span>${label}. ${option.context}</span>`;
			li.dataset.id = option.id;
			// Luôn giữ selected cho đáp án đã chọn
			if (q.userAnswer === option.context) {
				li.classList.add('selected');
			}
			
			if (isSubmitted) {	
				// Nếu đáp án này là đúng

				// Đáp án đúng luôn xanh
				if ((i + 1) === q.correctId) {
					li.classList.add('correct-answer');
				}
				// Nếu người dùng chọn đáp án này
				if (q.userAnswer === option.context) {
					li.classList.add('selected');
					// Nếu chọn sai thì đỏ
					if ((i + 1) !== q.correctId) {
						li.classList.add('wrong-answer');
					}
				}
				li.style.pointerEvents = 'none';
				li.style.opacity = '0.6';
			} else {
				li.addEventListener('click', () => {
					opts.querySelectorAll('li').forEach(el => el.classList.remove('selected'));
					li.classList.add('selected');
					generatedQuestions[idx].userAnswer = option.context;
					updateAnsweredNav();
				});
			}
			opts.appendChild(li);
		});
		if (isSubmitted && q.description) {
			const desc = document.createElement('div');
			desc.className = 'explanation';
			desc.innerHTML = `<strong>Giải thích:</strong> ${q.description}`;
			opts.appendChild(desc);
		}
	}

	// Hiển thị ảnh nếu có
	var examImg = document.getElementById('examImage');
	var examRight = document.querySelector('.exam-right');
	var examLeft = document.querySelector('.exam-left');
	if (q.media) {
		examImg.src = q.media;
		examImg.style.display = '';
		if (examRight) examRight.style.display = '';
		if (examLeft) examLeft.style.flex = '1 1 50%';
	} else {
		examImg.src = '';
		examImg.style.display = 'none';
		if (examRight) examRight.style.display = 'none';
		if (examLeft) examLeft.style.flex = '1 1 100%';
	}
	// document.getElementById('viewCorrect').innerText = q.correct;
	highlightNav(idx);
	updateAnsweredNav(); // ← cập nhật trạng thái nav
}


// Tải câu hỏi từ server và cập nhật giao diện
function loadQuestions() {
	// Kiểm tra trạng thái đã nộp bài
	isSubmitted = JSON.parse(localStorage.getItem('isSubmitted')) || false;
	generatedQuestions = JSON.parse(localStorage.getItem('questions')) || [];
	totalTimeSpent = parseInt(localStorage.getItem('examTime')) * 60 || 0;

	// Nếu đã nộp bài, hiển thị lại bài thi cũ
	if (isSubmitted) {
		totalQuestions = generatedQuestions.length;
		totalPages = Math.ceil(totalQuestions / pageSize);

		// Hiển thị thời gian đã làm bài
		const mins = Math.floor(totalTimeSpent / 60);
		const secs = totalTimeSpent % 60;
		document.getElementById("timerDisplay").innerText =
			`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

		// Khởi tạo giao diện
		initNav();
		showQuestion(0);

		// Khoá không cho chọn lại đáp án
		document.querySelectorAll('#viewOptions li').forEach(li => {
			li.style.pointerEvents = 'none';
			li.style.opacity = '0.6';
		});

		// Ẩn nút nộp bài
		const btn = document.querySelector('button[onclick="confirmSubmit()"]');
		if (btn) btn.disabled = true;
	} else {
		// Nếu chưa nộp bài, bắt đầu đếm ngược
		startCountdown();
	}

	// Chuyển trang
	document.getElementById('prevPage').addEventListener('click', () => {
		if (currentPage > 0) {
			currentPage--;
			renderPage();
		}
	});
	document.getElementById('nextPage').addEventListener('click', () => {
		const maxPage = Math.floor((totalQuestions - 1) / pageSize);
		if (currentPage < maxPage) {
			currentPage++;
			renderPage();
		}
	});

	// Nếu đã nộp bài, hiển thị lại modal kết quả đúng kiểu đề
	if (isSubmitted) {
		let correctCount = 0, wrongCount = 0, unansweredCount = 0;
		generatedQuestions.forEach((q) => {
			if (q.type === 'quiz' || q.type === 'Trắc nghiệm') {
				const correctIndex = parseInt(q.correct) - 1;
				const correctContext = (q.options && q.options[correctIndex]) ? q.options[correctIndex].context : '';
				if (!q.userAnswer) {
					unansweredCount++;
				} else if (String(q.userAnswer).trim().toLowerCase() === String(correctContext).trim().toLowerCase()) {
					correctCount++;
				} else {
					wrongCount++;
				}
			}
		});
		let resultText = '';
		const examType = localStorage.getItem('examType');
		const timeText = document.getElementById('timerDisplay') ? document.getElementById('timerDisplay').innerText : '';
		if (examType === 'essay' || examType === 'tự luận') {
			const totalEssay = generatedQuestions.filter(q => q.type === 'essay' || q.type === 'tự luận').length;
			const essayDone = generatedQuestions.filter(q => (q.type === 'essay' || q.type === 'tự luận') && q.userAnswer && q.userAnswer.trim() !== '').length;
			const essayNotDone = totalEssay - essayDone;
			resultText = `📝 Đề tự luận<br>Đã làm: <b>${essayDone}</b> / ${totalEssay}<br>Chưa làm: <b>${essayNotDone}</b><br>⏱️ Thời gian làm bài: ${timeText}`;
		} else if (examType === 'mix') {
			const quizQuestions = generatedQuestions.filter(q => q.type === 'quiz' || q.type === 'Trắc nghiệm');
			const essayQuestions = generatedQuestions.filter(q => q.type === 'essay' || q.type === 'tự luận');
			const quizCount = quizQuestions.length;
			const correctQuiz = quizQuestions.filter((q) => {
				const correctIndex = parseInt(q.correct) - 1;
				const correctContext = (q.options && q.options[correctIndex]) ? q.options[correctIndex].context : '';
				return q.userAnswer && String(q.userAnswer).trim().toLowerCase() === String(correctContext).trim().toLowerCase();
			}).length;
			const wrongQuiz = quizQuestions.filter((q) => {
				const correctIndex = parseInt(q.correct) - 1;
				const correctContext = (q.options && q.options[correctIndex]) ? q.options[correctIndex].context : '';
				return q.userAnswer && String(q.userAnswer).trim().toLowerCase() !== String(correctContext).trim().toLowerCase();
			}).length;
			const unansweredQuiz = quizQuestions.filter(q => !q.userAnswer).length;
			const totalEssay = essayQuestions.length;
			const essayDone = essayQuestions.filter(q => q.userAnswer && q.userAnswer.trim() !== '').length;
			const essayNotDone = totalEssay - essayDone;
			resultText = `<b>Đề mix</b><br><u>Trắc nghiệm:</u><br>✅ Đúng: ${correctQuiz}<br>❌ Sai: ${wrongQuiz}<br>⚠️ Chưa làm: ${unansweredQuiz}<br><u>Tự luận:</u><br>Đã làm: <b>${essayDone}</b> / ${totalEssay}<br>Chưa làm: <b>${essayNotDone}</b><br>⏱️ Thời gian làm bài: ${timeText}`;
		} else {
			resultText = `✅ Đúng: ${correctCount}<br>❌ Sai: ${wrongCount}<br>⚠️ Chưa làm: ${unansweredCount}<br>⏱️ Thời gian làm bài: ${timeText}`;
		}
		setTimeout(function() {
			if (document.getElementById('resultBody')) {
				document.getElementById('resultBody').innerHTML = resultText;
			}
			if (document.getElementById('resultModal')) {
				document.getElementById('resultModal').style.display = 'block';
			}
		}, 300);
	}
}

function updateAnsweredNav() {
	const navItems = document.querySelectorAll('#questionNav li');
	generatedQuestions.forEach((q, i) => {
		const li = navItems[i];
		if (!li) return;
		li.classList.remove('answered', 'unanswered', 'correct', 'wrong');
		if (q.userAnswer) {
			if (isSubmitted && (q.type === 'quiz' || q.type === 'Trắc nghiệm')) {
				// Đã nộp bài, đánh dấu đúng/sai cho câu trắc nghiệm
				const correctIndex = parseInt(q.correctId) - 1;
				const correctContext = (q.options && q.options[correctIndex]) ? q.options[correctIndex].context : '';
				if (String(q.userAnswer).trim().toLowerCase() === String(correctContext).trim().toLowerCase()) {
					li.classList.add('correct');
				} else {
					li.classList.add('wrong');
				}
			} else {
				// Chưa nộp bài hoặc câu tự luận
				li.classList.add('answered');
			}
		} else {
			if (isSubmitted) {
				li.classList.add('unanswered');
			}
		}
	});
}

function confirmSubmit() {
	// Hiển thị modal xác nhận nộp bài
	const modal = document.getElementById('confirmModal');
	modal.classList.remove('hidden');
	// Xử lý nút
	document.getElementById('confirmYes').onclick = function() {
		modal.classList.add('hidden');
		submitExam(1);
	};
	document.getElementById('confirmNo').onclick = function() {
		modal.classList.add('hidden');
	};
}

function closeConfirmModal() {
	document.getElementById('confirmModal').classList.add('hidden');
}

function submitExam(type) {
    const examId = localStorage.getItem('examId') || '';
	let studentInfo = JSON.parse(localStorage.getItem('studentInfo')) || {};
    const studentName = studentInfo.name || '';
    const studentCode = studentInfo.code || '';
    const studentSchool = studentInfo.school || '';
    const studentClass = studentInfo.class || '';
    const hasPoint = 0;
	if (type == 0) {
		// Gán userAnswer là đáp án đúng cho tất cả câu hỏi
		generatedQuestions.forEach((q) => {
			const correctIndex = parseInt(q.correct) - 1;
			const correctContext = (q.options && q.options[correctIndex]) ? q.options[correctIndex].context : '';
			q.userAnswer = correctContext;
		});
		// Đánh dấu đã nộp để khóa đáp án trên toàn bộ giao diện
		isSubmitted = true;
		localStorage.setItem('isSubmitted', true);
		// Hiển thị lại giao diện cho trang hiện tại
		renderPage();
		showQuestion(current);
		// Hiển thị modal kết quả đơn giản như resultText mẫu
		const resultText = `
			✅ Đúng: 0<br>
			❌ Sai: 0<br>
			⚠️ Chưa làm: ${totalQuestions}<br>
			⏱️ Thời gian làm bài: 0 phút 0 giây
		`;
		
		document.getElementById('resultBody').innerHTML = resultText;
		document.getElementById('resultModal').style.display = 'block';
		// Gửi kết quả lên BE với trạng thái chưa làm
		const resultData = {
			examId: examId,
			studentName: studentName,
			studentCode: studentCode,
			studentSchool: studentSchool,
			studentClass: studentClass,
			correct: 0,
			wrong: 0,
			unAnswer: totalQuestions,
			spentTime: 0,
			point: 0,
			answer: '[]',
			hasPoint: hasPoint
		};
		saveResult(resultData);
		return;
	}
	// Nếu isStudentDoing = 0 thì không submit bài thi
	if (localStorage.getItem('isStudentDoing') == '0') {
		renderPage();
		showQuestion(current);
		document.getElementById('resultBody').innerHTML = '<b>Chế độ thi thử: kết quả không được lưu.</b>';
		document.getElementById('resultModal').style.display = 'block';
		return;
	}
	if (isSubmitted) return; // Không nộp lại
	isSubmitted = true;
	localStorage.setItem('isSubmitted', isSubmitted); // Lưu trạng thái đã nộp
	clearInterval(timerInterval); // Dừng đếm giờ

	// Tính thời gian làm bài
	const now = Date.now();
	totalTimeSpent = Math.floor((now - timerStartAt) / 1000); // giây
	const mins = Math.floor(totalTimeSpent / 60);
	const secs = totalTimeSpent % 60;
	const timeText = `${mins} phút ${secs} giây`;

	let correctCount = 0;
	let wrongCount = 0;
	let unansweredCount = 0;
	let answer = [];

	generatedQuestions.forEach((q, idx) => {
		const navItem = document.querySelectorAll('#questionNav li')[idx];
		if (q.type === 'quiz' || q.type === 'Trắc nghiệm') {
			const correctIndex = parseInt(q.correctId) - 1;
			const correctContext = (q.options && q.options[correctIndex]) ? q.options[correctIndex].context : '';
			answer.push({
				questionId: q.id,
				type: q.type,
				userAnswer: q.userAnswer,
				correctAnswer: correctContext
			});
			if (!q.userAnswer) {
				unansweredCount++;
				navItem.classList.remove('correct', 'wrong');
				navItem.classList.add('unanswered');
			} else if (String(q.userAnswer).trim().toLowerCase() === String(correctContext).trim().toLowerCase()) {
				correctCount++;
				navItem.classList.remove('wrong', 'unanswered');
				navItem.classList.add('correct');
			} else {
				wrongCount++;
				navItem.classList.remove('correct', 'unanswered');
				navItem.classList.add('wrong');
			}
		} else if (q.type === 'essay' || q.type === 'tự luận') {
			answer.push({
				questionId: q.id,
				type: q.type,
				userAnswer: q.userAnswer,
				correctAnswer: null
			});
			// Nếu chưa nhập đáp án thì tính là chưa trả lời
			if (!q.userAnswer || q.userAnswer.trim() === '') {
				unansweredCount++;
				if (navItem) {
					navItem.classList.remove('answered');
					navItem.classList.add('unanswered');
				}
			}
		} else {
			// Loại khác, vẫn lưu đáp án
			answer.push({
				questionId: q.id,
				type: q.type,
				userAnswer: q.userAnswer,
				correctAnswer: null
			});
		}
	});

	// Khoá không cho chọn nữa
	document.querySelectorAll('#viewOptions li').forEach(li => {
		li.style.pointerEvents = 'none';
		li.style.opacity = '0.6';
	});

	// Ẩn nút nộp bài (nếu có)
	const btn = document.querySelector('button[onclick="confirmSubmit()"]');
	if (btn) btn.disabled = true;
	
	// Hiển thị kết quả bằng modal tuỳ loại đề
	let resultText = '';
	// Đã có examType ở trên, không khai báo lại
	if (examType === 'mix') {
		const quizQuestions = generatedQuestions.filter(q => q.type === 'quiz' || q.type === 'Trắc nghiệm');
		const essayQuestions = generatedQuestions.filter(q => q.type === 'essay' || q.type === 'tự luận');
		const quizCount = quizQuestions.length;
		const correctQuiz = quizQuestions.filter((q) => {
			const correctIndex = parseInt(q.correct) - 1;
			const correctContext = (q.options && q.options[correctIndex]) ? q.options[correctIndex].context : '';
			return q.userAnswer && String(q.userAnswer).trim().toLowerCase() === String(correctContext).trim().toLowerCase();
		}).length;
		const wrongQuiz = quizQuestions.filter((q) => {
			const correctIndex = parseInt(q.correct) - 1;
			const correctContext = (q.options && q.options[correctIndex]) ? q.options[correctIndex].context : '';
			return q.userAnswer && String(q.userAnswer).trim().toLowerCase() !== String(correctContext).trim().toLowerCase();
		}).length;
		const unansweredQuiz = quizQuestions.filter(q => !q.userAnswer).length;
		const totalEssay = essayQuestions.length;
		const essayDone = essayQuestions.filter(q => q.userAnswer && q.userAnswer.trim() !== '').length;
		const essayNotDone = totalEssay - essayDone;
		resultText = `<b>Đề mix</b><br><u>Trắc nghiệm:</u><br>✅ Đúng: ${correctQuiz}<br>❌ Sai: ${wrongQuiz}<br>⚠️ Chưa làm: ${unansweredQuiz}<br><u>Tự luận:</u><br>Đã làm: <b>${essayDone}</b> / ${totalEssay}<br>Chưa làm: <b>${essayNotDone}</b><br>⏱️ Thời gian làm bài: ${timeText}`;
	} else if (examType === 'essay' || examType === 'tự luận') {
		const totalEssay = generatedQuestions.filter(q => q.type === 'essay' || q.type === 'tự luận').length;
		const essayDone = generatedQuestions.filter(q => (q.type === 'essay' || q.type === 'tự luận') && q.userAnswer && q.userAnswer.trim() !== '').length;
		const essayNotDone = totalEssay - essayDone;
		resultText = `
			📝 Đề tự luận<br>
			Đã làm: <b>${essayDone}</b> / ${totalEssay}<br>
			Chưa làm: <b>${essayNotDone}</b><br>
			⏱️ Thời gian làm bài: ${timeText}
		`;
	} else {
		resultText = `
			✅ Đúng: ${correctCount}<br>
			❌ Sai: ${wrongCount}<br>
			⚠️ Chưa làm: ${unansweredCount}<br>
			⏱️ Thời gian làm bài: ${timeText}
		`;
	}
	
	// Hiển thị spinner khi submit
    const spinnerModal = document.getElementById('loadingModal');
    if (spinnerModal) spinnerModal.style.display = 'flex';

	// Đẩy dữ liệu lên BE
	// Tính điểm chỉ khi đề là quiz, còn mix/essay thì point = 0
	const examType = localStorage.getItem('examType');
	let point = 0;
	if (examType === 'quiz' || examType === 'Trắc nghiệm') {
		const quizCount = generatedQuestions.filter(q => q.type === 'quiz' || q.type === 'Trắc nghiệm').length;
		point = quizCount > 0 ? Math.round((correctCount / quizCount) * 10 * 100) / 100 : 0;
		hasPoint = 1;
	} else {
		hasPoint = 0;
	}
	const spentTime = totalTimeSpent;
	const resultData = {
		examId: examId,
		studentName: studentName,
		studentCode: studentCode,
		studentSchool: studentSchool,
		studentClass: studentClass,
		correct: correctCount,
		wrong: wrongCount,
		unAnswer: unansweredCount,
		spentTime: spentTime,
		point: point,
		answer: JSON.stringify(answer), // Lưu dưới dạng chuỗi JSON
		hasPoint: hasPoint
	};
	
	localStorage.setItem('questions', JSON.stringify(generatedQuestions));
	// Gửi kết quả lên BE, xong mới hiện modal kết quả
	saveResult(resultData).then((response) => {
		if (spinnerModal) spinnerModal.style.display = 'none';
		if (response && response.error) {
			document.getElementById('resultBody').innerHTML = `<span style='color:#d63031;font-weight:500;'>${response.error}</span>`;
			document.getElementById('resultModal').style.display = 'block';
			return;
		}
		// Đảm bảo cập nhật lại trạng thái đã nộp và hiển thị đáp án đúng cho tất cả câu hỏi
		isSubmitted = true;
		localStorage.setItem('isSubmitted', true);
		renderPage();
		showQuestion(current);
		document.getElementById('resultBody').innerHTML = resultText;
		document.getElementById('resultModal').style.display = 'block';
	});
}

// Gửi kết quả thi lên backend
async function saveResult(resultData) {
    const url = ggApiUrl;
    const formData = new FormData();
    formData.append('action', 'submitExam');
    Object.keys(resultData).forEach(key => {
        formData.append(key, resultData[key]);
    });
    try {
        const res = await fetch(url, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        return data;
    } catch (err) {
        return null;
    }
}

function closeResultModal() {
	document.getElementById('resultModal').style.display = 'none';
}

function newExam() {
	localStorage.setItem('isSubmitted', false);
	localStorage.setItem('questions', JSON.stringify([]));
	window.location.href = 'create.html';
}

function generatedOptions(question) {
	let newQuestion = [];
	for (let i = 0; i < question.length; i++) {
		const q = question[i];
		// Nếu là tự luận thì không cần options/correct
		if (q.type && (q.type === 'essay' || q.type === 'tự luận')) {
			// Chỉ giữ các trường cần thiết cho tự luận, lưu thêm userAnswer nếu có
			let { id, question: ques, media, subject, type, grade, description, difficulty, note, userAnswer } = q;
			// Xử lý difficulty
			let diff = "";
			if (difficulty === "dễ") {
				diff = "easy";
			} else if (difficulty === "trung bình") {
				diff = "medium";
			} else if (difficulty === "khó") {
				diff = "hard";
			} else {
				diff = difficulty;
			}
			newQuestion.push({
				id: id || `Q${i + 1}`,
				question: ques || "",
				media: media || "",
				subject: subject || "",
				type: type || "essay",
				grade: grade || "",
				description: description || "",
				difficulty: diff,
				note: note || "",
				userAnswer: userAnswer || ""
			});
		} else {
			// Trắc nghiệm: giữ options/correct như cũ
			const options = ['A', 'B', 'C', 'D'].map((opt, idx) => ({
				context: q[opt] || '',
				id: idx + 1 // Đảm bảo ID từ 1 đến 4
			}));
			q['options'] = options;
			// Xử lý difficulty
			let difficulty = "";
			if (q.difficulty === "dễ") {
				difficulty = "easy";
			} else if (q.difficulty === "trung bình") {
				difficulty = "medium";
			} else if (q.difficulty === "khó") {
				difficulty = "hard";
			}
			q['difficulty'] = difficulty;
			newQuestion.push(q);
		}
	}
	return newQuestion;
}

async function getTeacherById() {
	let id = JSON.parse(localStorage.getItem('user')).id || 0;
	const url = ggApiUrl + `?action=getTeacherById&id=${encodeURIComponent(id)}`;
	try {
		const res = await fetch(url);
		if (!res.ok) {
			throw new Error(`HTTP error! status: ${res.status}`);
		}
		const data = await res.json();
		localStorage.setItem('user', JSON.stringify(data));
	} catch (err) {
		
	}
}