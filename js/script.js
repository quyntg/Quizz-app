let current = 0;
const pageSize = 40;
let currentPage = 0;
let generatedQuestions = [];
let totalQuestions = 0;
let totalPages = 0;
let timerDuration = 0; // 30 phút = 1800 giây
let timerInterval;
let isSubmitted = localStorage.getItem('isSubmitted') ? JSON.parse(localStorage.getItem('isSubmitted')) : false;
let totalTimeSpent = 0; // giây
let timerStartAt = null;

function loadPage(url) {
	const app = document.getElementById('app');
	fetch(url)
	.then(res => res.text())
	.then(html => {
		app.innerHTML = html;
	})
	.catch(() => {
		app.innerHTML = "<h2>Page not found</h2>";
	});
}

function startExam() {
	localStorage.removeItem('studentInfo');
	localStorage.setItem('isStudentDoing', '0');
	page('/exam');
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
			page('/load');
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

function startCountdown(seconds) {
	// Đảm bảo timerDuration luôn đúng
	if (!seconds || isNaN(seconds) || seconds <= 0) {
		// Lấy lại từ localStorage nếu chưa có
		seconds = parseInt(localStorage.getItem('examTime')) * 60 || 1800;
		timerDuration = seconds;
	} else {
		timerDuration = seconds;
	}
	if (timerInterval) clearInterval(timerInterval); // Đảm bảo không có nhiều interval
	timerStartAt = Date.now(); // Ghi lại thời điểm bắt đầu
	let timeLeft = timerDuration;
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
    const timerEl = document.getElementById("timerDisplay");
    if (timerEl) timerEl.innerText = display;
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
	page('/create');
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

// start js login	
function login() {
	const username = document.getElementById('login-username').value.trim();
	const password = document.getElementById('login-password').value.trim();
	const errorEl = document.getElementById("error");
	const loginBtn = document.getElementById("loginBtn");

	if (!username || !password) {
		errorEl.textContent = "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.";
		errorEl.classList.remove('hidden');
		return;
	}

	// Hiệu ứng quay và disable nút
	loginBtn.disabled = true;
	loginBtn.innerHTML = '<span class="spinner"></span> Đang đăng nhập...';

	const url = ggApiUrl + `?action=login&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
	fetch(url)
		.then((res) => {
			if (!res.ok) {
				throw new Error(`HTTP error! status: ${res.status}`);
			}
			return res.json();
		})
		.then((data) => {
			localStorage.setItem('user', JSON.stringify(data.user || {}));
			loginBtn.disabled = false;
			loginBtn.innerHTML = 'Đăng nhập';
			if (data.success) {
				errorEl.classList.add("hidden");
				document.getElementById('successMessage').textContent = data.message || "Bạn đã đăng nhập thành công!";
				document.getElementById('successModal').style.display = 'flex';
				localStorage.setItem('isLoggedIn', 1);
				localStorage.setItem('isChange', 0);
			} else {
				errorEl.textContent = data.message || "Sai thông tin đăng nhập.";
				errorEl.classList.remove("hidden");
			}
		})
		.catch((err) => {
			loginBtn.disabled = false;
			loginBtn.innerHTML = 'Đăng nhập';
			errorEl.textContent = "Không thể kết nối máy chủ.";
			errorEl.classList.remove("hidden");
		});
}

function showRegister() {
	page('/register');
}

function showForgot() {
	document.getElementById('forgotModal').style.display = 'flex';
}

function closeForgotModal() {
	document.getElementById('forgotModal').style.display = 'none';
}

function goToInfo() {
	let user = JSON.parse(localStorage.getItem('user') || '{}');
	if (user.note == 'nhaplieu') {
		page('/createQuestion');
	} else {                 
		page('/info');
	}
}

function closeSuccessModal() {
	document.getElementById('successModal').style.display = 'none';
}

function initLoginPage() {
	const loginForm = document.getElementById('login-form');
	if (loginForm) {
		loginForm.addEventListener('keydown', function(e) {
			if (e.key === 'Enter') {
				e.preventDefault();
				login();
			}
		});
	}

	const loginBtn = document.getElementById('loginBtn');
	if (loginBtn) {
		loginBtn.addEventListener('click', function(e) {
			e.preventDefault();
			login();
		});
	}
	
	const registerBtn = document.getElementById('registerBtn');
	if (registerBtn) {
		registerBtn.addEventListener('click', function(e) {
			e.preventDefault();
			showRegister();
		});
	}
	const forgotBtn = document.getElementById('forgotBtn');
	if (forgotBtn) {
		forgotBtn.addEventListener('click', function(e) {
			e.preventDefault();
			showForgot();
		});
	}
}
        
// end js login

// start js register

let checkRegister = 1;
function register() {	
	const btn = document.getElementById('btnRegister');
	const icon = document.getElementById('iconRegister');
	btn.disabled = true;
	icon.style.display = 'inline-block';

	// Validate số điện thoại thêm lần nữa
	const phone = document.getElementById('phone').value;
	const phoneRegex = /^0[0-9]{9}$/;
	if (!phoneRegex.test(phone)) {
		showResultModal('Lỗi đăng ký', 'Số điện thoại không hợp lệ!');
		btn.disabled = false;
		icon.style.display = 'none';
		return;
	}

	// Lấy dữ liệu từ form
	const formData = {};
	new FormData(this).forEach((value, key) => {
		if (key === 'id' || key === 'phone') {
			formData[key] = String(value);
		} else if (key === 'birthday') {
			// Format ngày sinh thành dd/mm/yyyy
			if (value) {
				const d = new Date(value);
				const day = String(d.getDate()).padStart(2, '0');
				const month = String(d.getMonth() + 1).padStart(2, '0');
				const year = d.getFullYear();
				formData[key] = `${day}/${month}/${year}`;
			} else {
				formData[key] = '';
			}
		} else {
			formData[key] = value;
		}
	});
	formData['action'] = 'register';
	// Gửi dữ liệu lên Google Apps Script bằng fetch
	fetch(ggApiUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams(formData)
	})
	.then(response => response.json())
	.then(data => {
		if (data.success) {
			showResultModal('Đăng ký thành công', 'Chúc mừng bạn đã đăng ký thành công!<br>Vui lòng chờ <b>ADMIN</b> hoặc liên hệ <a href="tel:0914261688">0914 261 688</a><br> để kích hoạt tài khoản.');
			document.getElementById('registerForm').reset();
			checkRegister = 1;
		} else {
			showResultModal('Lỗi đăng ký', data.message || 'Đăng ký thất bại! Vui lòng thử lại.');
			checkRegister = 0;
		}
	})
	.catch(error => {
		showResultModal('Lỗi đăng ký', 'Đăng ký thất bại! Vui lòng thử lại.');
		checkRegister = 0;
	})
	.finally(() => {
		btn.disabled = false;
		icon.style.display = 'none';
	});
}

function showResultModal(title, content) {
	document.getElementById('resultTitle').innerText = title;
	document.getElementById('resultContent').innerHTML = content;
	document.getElementById('resultModal').style.display = 'flex';
}

function closeResultModal() {
	if (checkRegister === 1) {
		page('/login');
	}
	document.getElementById('resultModal').style.display = 'none';
	document.getElementById('registerForm').reset();
}

// Hiệu ứng xoay cho icon
const style = document.createElement('style');
style.innerHTML = `
.rotating-icon {
	animation: rotate 1s linear infinite;
}
@keyframes rotate {
	100% { transform: rotate(360deg); }
}
`;
document.head.appendChild(style);

function initSubjectSelect() {
	const subjectSelect = document.getElementById('subject');
	if (subjectSelect && subjectSelect.options.length <= 1 && typeof subjects !== 'undefined') {
		subjects.forEach(sub => {
			const opt = document.createElement('option');
			opt.value = sub.value;
			opt.textContent = sub.text;
			subjectSelect.appendChild(opt);
		});
	}
}
// end js register

//start js info 
function showGreeting() {
	const user = JSON.parse(localStorage.getItem('user')) || {};
	const teacherName = user.name || localStorage.getItem('teacherName') || '';
	if (teacherName) {
		document.getElementById('greetingText').innerHTML = `👋 Chào, <b>${teacherName}</b>`;
		document.getElementById('user-greeting').style.display = 'block';
	} else {
		document.getElementById('user-greeting').style.display = 'none';
	}
}

function actionGreeting() {
	document.getElementById('user-greeting').addEventListener('click', function(e) {
		e.stopPropagation();
		const menu = document.getElementById('greetingMenu');
		menu.classList.remove('hidden');
	});

	document.addEventListener('click', function(e) {
		const menu = document.getElementById('greetingMenu');
		if (menu && !menu.classList.contains('hidden')) {
			menu.classList.add('hidden');
		}
	});
}

function backToLogin() {
	localStorage.setItem('isLoggedIn', 0);
	page('/login');
}

// Đảm bảo getTeacherById chạy xong mới thực thi các script khác
async function runAfterGetTeacher() {
	// Luôn gọi await getTeacherById() để đảm bảo chạy async
	// Hiện modal loading
	if (document.getElementById('loadingModal')) {
		document.getElementById('loadingModal').style.display = 'flex';
	}
	if (typeof getTeacherById === 'function') {
		await getTeacherById();
	}
	// Ẩn modal loading
	if (document.getElementById('loadingModal')) {
		document.getElementById('loadingModal').style.display = 'none';
	}	
	// Lấy thông tin giáo viên từ localStorage
	const user = JSON.parse(localStorage.getItem('user')) || {};
	document.getElementById('teacherName').textContent = user.name || '';
	document.getElementById('teacherBirthday').textContent = formatBirthday(user.birthday);
	document.getElementById('teacherGender').textContent = user.gender || '';
	document.getElementById('teacherEmail').textContent = user.email || '';
	document.getElementById('teacherPhone').textContent = user.phone || '';
	document.getElementById('teacherSchool').textContent = user.school || '';

	if (user.schoolLevel == 'primary') {
		document.getElementById('teacherLevel').textContent = 'Tiểu học';
	} else if (user.schoolLevel == 'secondary') {
		document.getElementById('teacherLevel').textContent = 'Trung học cơ sở';
	} else if (user.schoolLevel == 'high') {
		document.getElementById('teacherLevel').textContent = 'Trung học phổ thông';
	} else {
		document.getElementById('teacherLevel').textContent = 'Chưa xác định';
	}

	subjects.forEach(sub => {
		if (sub.value === user.subject) {
			document.getElementById('teacherSubject').textContent = sub.text || '';
		}
	});

	// Lấy danh sách đề thi đã tạo từ localStorage hoặc API
	async function fetchExams() {
		let exams = JSON.parse(user.listExam) || [];
		const examListDiv = document.getElementById('examList');
		const paginationDiv = document.getElementById('pagination');
		examListDiv.innerHTML = '';
		paginationDiv.innerHTML = '';
		const pageSize = 5;
		let currentPage = 1;
		let totalPages = Math.ceil(exams.length / pageSize);

		function renderPage(page) {
			examListDiv.innerHTML = '';
			let subjectName = '';
				const startIdx = (page - 1) * pageSize;
				const endIdx = Math.min(startIdx + pageSize, exams.length);
				for (let i = startIdx; i < endIdx; i++) {
				const exam = exams[i];
				subjectName = '';
				subjects.forEach(sub => {
					if (sub.value === exam.subject) {
						subjectName = sub.text || '';
					}
				});
				examListDiv.innerHTML += `
					<div class='exam-item exam-flex'>
						<div style='flex:1;'>
							<div class='exam-title'>${exam.name || 'Đề thi không tên'}</div>
							<div class='exam-meta'>Loại đề:<b> ${exam.type || ''} </b><br><div class='exam-meta'>Môn:<b> ${subjectName || ''} </b>| Khối:<b> ${exam.grade || ''} </b> | Số câu:<b> ${exam.total || ''}</b><br>Thời gian:<b> ${exam.time || ''} phút</b> | Ngày tạo:<b> ${exam.createDate || ''}</b></div>
						</div>
						<div class='exam-btn-group-side'>
							<button class='exam-enter-btn' onclick="enterExam(this, '${exam.subject || ''}', '${exam.id || ''}')">
								<span class='modern-spinner' style='display:none'></span>
								Xem đề
							</button>
							<button class='exam-link-btn' onclick="getExamLink(this, '${exam.id || ''}', '${exam.subject || ''}')">
								<span class='modern-spinner' style='display:none'></span>
								Link đề
							</button>
							<button class='exam-result-btn' onclick="showExamResult(this, '${exam.subject || ''}', '${exam.id || ''}', '${exam.name || ''}', '${exam.type || ''}', '${exam.time || ''}')">
								<span class='modern-spinner' style='display:none'></span>
								Kết quả
							</button>
						</div>
					</div>`;
			}
		}

		function renderPagination() {
			if (exams.length < 6) {
				paginationDiv.style.display = 'none';
				return;
			}
			paginationDiv.style.display = 'block';
			let html = '';
			html += `<button ${currentPage === 1 ? 'disabled' : ''} onclick='changePage(${currentPage - 1})'>Trước</button>`;
			for (let i = 1; i <= totalPages; i++) {
				html += `<button ${i === currentPage ? 'style="background:#2c7be5;color:#fff;"' : ''} onclick='changePage(${i})'>${i}</button>`;
			}
			html += `<button ${currentPage === totalPages ? 'disabled' : ''} onclick='changePage(${currentPage + 1})'>Sau</button>`;
			paginationDiv.innerHTML = html;
		}

		window.changePage = function(page) {
			if (page < 1 || page > totalPages) return;
			currentPage = page;
			renderPage(currentPage);
			renderPagination();
		};

		if (!exams.length) {
			examListDiv.innerHTML = `<div class='exam-item' style="color:#888;">Chưa có đề thi nào.</div>`;
			paginationDiv.style.display = 'none';
		} else {
			renderPage(currentPage);
			renderPagination();
		}
	}
	fetchExams();
}

function formatBirthday(birthday) {
	if (!birthday) return '';
	// Nếu đã đúng định dạng dd/mm/yyyy thì trả về luôn
	if (/^\d{2}\/\d{2}\/\d{4}$/.test(birthday)) return birthday;
	// Nếu là yyyy-mm-dd thì chuyển sang dd/mm/yyyy
	if (/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
		const [y, m, d] = birthday.split('-');
		return `${d}/${m}/${y}`;
	}
	// Nếu là dạng khác thì cố gắng parse
	try {
		const d = new Date(birthday);
		const day = String(d.getDate()).padStart(2, '0');
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const year = d.getFullYear();
		return `${day}/${month}/${year}`;
	} catch {
		return birthday;
	}
}

function enterExam(btn, subject, id) {
	btn.disabled = true;
	const spinner = btn.querySelector('.modern-spinner');
	spinner.style.display = 'inline-block';

	// Sử dụng GET thay vì POST
	const url = `${ggApiUrl}?action=getExamById&id=${encodeURIComponent(id)}&subject=${encodeURIComponent(subject)}`;
	fetch(url)
	.then(res => res.json())
	.then(data => {
		if (data) {
			localStorage.setItem('examName', data.name || '');
			localStorage.setItem('examTime', data.time || '');
			localStorage.setItem('examType', data.type || '');
			let form = {
				quiz: { easy: data.easy || 0, medium: data.medium || 0, hard: data.hard || 0 },
				essay: { easy: data.essayEasy || 0, medium: data.essayMedium || 0, hard: data.essayHard || 0 }
			};
			localStorage.setItem('form', JSON.stringify(form));
			localStorage.setItem('grade', data.grade || '');
			localStorage.setItem('school', data.school || '');
			localStorage.setItem('type', data.type || '');
			localStorage.setItem('subject', data.subject || '');
			localStorage.setItem('totalQuestions', data.total || 0);                  
			localStorage.setItem('examId', data.id);

			let newQuestions = generatedOptions(data.list || []);
			let examType = data.type;
			let generatedQuestions = generateExamFromQuestions(newQuestions, data.total, form, examType);
			localStorage.setItem('questions', JSON.stringify(generatedQuestions));
			localStorage.setItem('isNewExam', 0);     
		} else {
			
		}
	})
	.catch(() => {
		// Xử lý lỗi nếu cần
	})
	.finally(() => {
		spinner.style.display = 'none';
		page('/load?id=' + id);
	});
}

function getExamLink(btn, examId, subject) {
	btn.disabled = true;
	const spinner = btn.querySelector('.modern-spinner');
	spinner.style.display = 'inline-block';
	const link = window.location.origin + '/#!/student?id=' + examId + '&subject=' + subject;
	navigator.clipboard.writeText(link).then(() => {
		showCopyLinkModal('Đã copy link đề thi:', '<span style="word-break: break-all; color: #2c7be5; font-weight: 500;">' + link + '</span>');
	}, () => {
		showCopyLinkModal('Không thể copy link. Link:', '<span style="word-break: break-all; color: #d63031; font-weight: 500;">' + link + '</span>');
	}).finally(() => {
		spinner.style.display = 'none';
		btn.disabled = false;
	});
}

function showExamResult(btn, subject, examId, name, type, time) {
	btn.disabled = true;
	const spinner = btn.querySelector('.modern-spinner');
	spinner.style.display = 'inline-block';
	const url = `${ggApiUrl}?action=getResultById&examId=${encodeURIComponent(examId)}`;
		fetch(url)
		.then(res => res.json())
		.then(data => {
			if (!data || !data.length) {
				spinner.style.display = 'none';
				btn.disabled = false;
				showCopyLinkModal('Thông báo: ', '<b>Đề này chưa có bài thi nào!</b>');
				return;
			}
			localStorage.setItem('studentResults', JSON.stringify(data));
			localStorage.setItem('subject', subject);
			localStorage.setItem('examId', examId);
			localStorage.setItem('examName', name);
			localStorage.setItem('examType', type);
			localStorage.setItem('examTime', time);
			page('/result?examId=' + examId);
		})
		.catch(() => {
			alert('Không lấy được kết quả!');
		})
		.finally(() => {
			spinner.style.display = 'none';
			btn.disabled = false;
		});
}

function showCopyLinkModal(title, content) {
	document.getElementById('copyLinkTitle').innerHTML = title; 
	document.getElementById('copyLinkContent').innerHTML = content;
	document.getElementById('copyLinkModal').style.display = 'flex';
}

function closeCopyLinkModal() {
	document.getElementById('copyLinkModal').style.display = 'none';
}
//end js info

// start result info
function formatDateTime(dateStr) {
	if (!dateStr) return '';
	try {
		const d = new Date(dateStr);
		const day = String(d.getDate()).padStart(2, '0');
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const year = d.getFullYear();
		const hour = String(d.getHours()).padStart(2, '0');
		const min = String(d.getMinutes()).padStart(2, '0');
		const sec = String(d.getSeconds()).padStart(2, '0');
		return `${day}/${month}/${year} ${hour}:${min}:${sec}`;
	} catch {
		return dateStr;
	}
}

function formatTimeMin(timeVal) {
	if (!timeVal) return '00:00';
	// Nếu là số giây, chuyển sang mm:ss
	if (!isNaN(timeVal)) {
		const mins = Math.floor(Number(timeVal) / 60);
		const secs = Number(timeVal) % 60;
		return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
	}
	// Nếu đã có dạng mm:ss thì giữ nguyên
	if (/^\d{2}:\d{2}$/.test(String(timeVal))) return timeVal;
	// Nếu là "x phút" thì chuyển sang mm:00
	const match = String(timeVal).match(/(\d+)\s*phút/);
	if (match) {
		return `${String(match[1]).padStart(2, '0')}:00`;
	}
	return timeVal;
}

// Hiển thị modal chấm bài khi bấm nút "Chấm bài"
function markStudentExam(resultId, studentSchool) {
	localStorage.setItem('school', studentSchool || '');
	// Xóa modal cũ nếu có
	let oldModal = document.getElementById('markEssayModal');
	if (oldModal) oldModal.remove();
	// Tạo modal
	const modal = document.createElement('div');
	modal.id = 'markEssayModal';
	modal.classList.add('modal-overlay');
	// Responsive: web vs mobile
	const isMobile = window.innerWidth <= 600;
	let modalContent = document.createElement('div');
	modalContent.classList.add('modal-content-mark');
	// Lấy dữ liệu kết quả
	let studentResults = JSON.parse(localStorage.getItem('studentResults')) || [];
	let result = studentResults.find(r => r.id == resultId);
	if (!result) {
		alert('Không tìm thấy kết quả!');
		return;
	}            
	localStorage.setItem('isViewResult', 1);
	localStorage.setItem('isStudent', 1);
	localStorage.setItem('resultId', resultId);
	localStorage.setItem('examId', result.examId);
	localStorage.setItem('studentName', result.studentName);
	localStorage.setItem('studentClass', result.studentClass);
	let examType = localStorage.getItem('examType') == 'Trắc nghiệm' ? "quiz" : localStorage.getItem('examType') == 'Tự luận' ? "essay" : localStorage.getItem('examType') == 'Trắc nghiệm + Tự luận' ? "mix" : "";
	let essayAnswers = JSON.parse(result.answer).filter(r => r.type === "essay");
	// 70%: giao diện bài làm (nhúng file html/form.html qua iframe)
	let formBlock = document.createElement('div');
	formBlock.classList.add('form-block');
	formBlock.innerHTML = `<iframe src="html/form.html" style="width: 100%; height: ${isMobile ? '400px' : '70vh'}; border: none; border-radius: 8px; background: #f8f9fa;"></iframe>`;
	formBlock.innerHTML = `<iframe src="html/form.html" class="form-iframe"></iframe>`;
	// 30%: giao diện chấm điểm tự luận
	let markBlock = document.createElement('div');
	markBlock.classList.add('mark-block');
	// Render phần chấm điểm tự luận
	let essayHtml = `<h3 class='mark-title'>Chấm điểm tự luận</h3>`;
	if (essayAnswers && Array.isArray(essayAnswers) && essayAnswers.length > 0) {
		essayAnswers.forEach((ans, idx) => {
			essayHtml += `<div class='mark-question'>
				<div class='mark-q-title'>Câu ${idx + 1}: ${ans.question || ''}</div>
				<div class='mark-q-score'>
					<label for='score_${resultId}_${idx}' class='mark-q-score-label'>Điểm:</label>
					<input type='number' id='score_${resultId}_${idx}' min='0' max='10' step='0.25' value='${ans.score || ''}' class='mark-q-score-input'>
				</div>
			</div>`;
		});
	} else {
		essayHtml += `<div class='mark-no-question'>Không có câu tự luận để chấm.</div>`;
	}
	essayHtml += `<div id="scoreError" class="error-message" style="display: none;"></div>`;
	essayHtml += `<div style="text-align: center;"><button onclick='saveScore(${JSON.stringify(resultId)}, "${examType}")' class='btn-save-score'><span>Lưu điểm</span><div class='spinner'></div></button></div>`;
	markBlock.innerHTML = essayHtml;
	// Thêm vào modal
	if (isMobile) {
		modalContent.appendChild(markBlock);
		modalContent.appendChild(formBlock);
	} else {
		modalContent.appendChild(formBlock);
		modalContent.appendChild(markBlock);
	}
	// Nút đóng
	let closeBtn = document.createElement('button');
	closeBtn.textContent = 'Đóng';
	closeBtn.classList.add('btn-close-modal');
	closeBtn.onclick = function() { modal.remove(); };
	modalContent.appendChild(closeBtn);
	modal.appendChild(modalContent);
	document.body.appendChild(modal);
}

function updateResultPoint(resultId, point) {
	if (!resultId || !point) return;
	// Gọi API cập nhật điểm và trạng thái chấm bài
	fetch(ggApiUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: `action=updateResultPoint&resultId=${encodeURIComponent(resultId)}&point=${encodeURIComponent(point)}&hasPoint=1`
	})
	.then(res => res.json())
	.then(data => {
		// Có thể xử lý thêm nếu cần
	})
	.catch(err => {
		console.error('Lỗi cập nhật điểm:', err);
	}).finally(() => {
		document.getElementById('markEssayModal').style.display = 'none';
		let saveBtn = document.querySelector('.btn-save-score');
		document.getElementById('scoreResultText').textContent = `Chấm bài thành công!`;
		document.getElementById('scoreResultModal').style.display = 'flex';
		if (saveBtn) {
			setTimeout(() => {
				saveBtn.disabled = false;
				saveBtn.classList.remove('loading');
			}, 800);
		}
	});
}

// Hàm lưu điểm tự luận
function saveScore(resultId, examType) {
	let studentResults = JSON.parse(localStorage.getItem('studentResults')) || [];
	let result = studentResults.find(r => r.id == resultId);
	if (!result) return;
	let answers = JSON.parse(result.answer);
	let essayAnswers = answers.filter(r => r.type === "essay");
	let quizAnswers = answers.filter(r => r.type === "quiz");
	// Tính điểm trắc nghiệm
	let totalQuizScore = 0;
	let totalEssayScore = 0;
	let quizRatio = quizAnswers.length / answers.length;
	let essayRatio = essayAnswers.length / answers.length;
	let quizScore = quizRatio / quizAnswers.length * 10; // Mỗi câu đúng được bao nhiêu điểm
	let essayScore = essayRatio / essayAnswers.length * 10; // Mỗi câu đúng được bao nhiêu điểm
	let maxQuizScore = quizRatio * 10;
	let maxEssayScore = essayRatio * 10;

	if (quizAnswers.length > 0) {
		quizAnswers.forEach(q => {
			if (q.userAnswer && q.userAnswer == q.correctAnswer) {
				totalQuizScore += quizScore;
			}
		});
	}
	
	// Nhập điểm tự luận
	let missingEssay = false;
	essayAnswers.forEach((ans, idx) => {
		let scoreInput = document.getElementById(`score_${resultId}_${idx}`);
		if (!scoreInput || scoreInput.value === "" || scoreInput.value === null) {
			missingEssay = true;
		} else {
			let val = Number(scoreInput.value);
			if (isNaN(val)) val = 0;
			ans.score = val;
			totalEssayScore += val;
		}
	});
	
	// Xóa thông báo lỗi cũ nếu có
	let errorDiv = document.getElementById('scoreError');
	if (errorDiv) errorDiv.textContent = '';
	let saveBtn = document.querySelector('.btn-save-score');
	if (saveBtn) {
		saveBtn.disabled = true;
		saveBtn.classList.add('loading');
	}
	if (missingEssay || essayAnswers.length === 0) {
		errorDiv.textContent = 'Bạn phải nhập đủ điểm cho tất cả câu tự luận!';
		errorDiv.style.display = 'block';
		return;
	}
	if (totalEssayScore > maxEssayScore) {
		errorDiv.textContent = 'Tổng điểm tự luận vượt quá tỉ lệ cho phép!';
		errorDiv.style.display = 'block';
		return;
	}
	let totalScore = totalQuizScore + totalEssayScore;
	if (totalScore > 10) {
		errorDiv.textContent = 'Tổng điểm vượt quá 10!';
		errorDiv.style.display = 'block';
		return;
	}
	let point = Math.round(totalScore * 100) / 100;
	// errorDiv.textContent = 'Đã lưu điểm tự luận = ' + point;
	// errorDiv.style.display = 'block';
	updateResultPoint(resultId, point);
	// Hiển thị modal kết quả lưu điểm
}

function renderStudentResults(results) {
	const tableBody = document.querySelector('#studentResultTable tbody');
	const resultList = document.getElementById('studentResultList');
	const noResultDiv = document.getElementById('noResult');
	const paginationDiv = document.getElementById('pagination');
	tableBody.innerHTML = '';
	resultList.innerHTML = '';
	paginationDiv.innerHTML = '';
	if (!results || results.length === 0) {
		noResultDiv.style.display = 'block';
		paginationDiv.style.display = 'none';
		return;
	}
	noResultDiv.style.display = 'none';
	// Phân trang
	const isMobile = window.innerWidth <= 600;
	const pageSize = isMobile ? 5 : 10;
	let currentPage = 1;
	const totalPages = Math.ceil(results.length / pageSize);
	function renderPage(page) {
		tableBody.innerHTML = '';
		resultList.innerHTML = '';
		const startIdx = (page - 1) * pageSize;
		const endIdx = Math.min(startIdx + pageSize, results.length);
		for (let i = startIdx; i < endIdx; i++) {
			const result = results[i];
			let showMarkBtn = false;
			// Sử dụng examType từ từng kết quả
			const examType = result.examType || localStorage.getItem("examType") || '';
			if (
				Number(result.point) === 0 &&
				result.hasPoint == 0 &&
				(examType === 'mix' || examType === 'essay' || examType === 'Tự luận' || examType === 'Trắc nghiệm + Tự luận')
			) {
				showMarkBtn = true;
			}
			// Bảng web
			tableBody.innerHTML += `
				<tr>
					<td class="stt">${i + 1}</td>
					<td class="name">${result.studentName}</td>
					<td class="code">${result.studentCode}</td>
					<td>${result.studentClass}</td>
					<td>${result.studentSchool}</td>
					<td class="point">${result.point}</td>
					<td class="time">${formatTimeMin(result.spentTime)}</td>
					<td style="text-align:center;">
						<button onclick="viewStudentExam('${result.studentCode}', '${result.studentName}', '${result.studentClass}', '${result.studentSchool}', '${result.examId || ''}', '${result.id || ''}')" style="padding: 4px 10px;  border-radius:6px; background: #2c7be5; color: #fff; border: none; cursor: pointer;">Xem</button>
						${showMarkBtn ? `<button onclick="markStudentExam('${result.id}', '${result.studentSchool}')" style="margin-top: 6px; padding: 4px 10px; border-radius: 6px; background: #00b894; color: #fff; border: none; cursor: pointer;">Chấm bài</button>` : ''}
					</td>
					<td class="status">${formatDateTime(result.submitDate)}</td>
				</tr>
			`;
			// Card mobile
			resultList.innerHTML += `
				<div class="result-card">
					<div class="card-row"><span class="card-label">STT:</span> <span class="card-value">${i + 1}</span></div>
					<div class="card-row"><span class="card-label">Họ tên:</span> <span class="card-value">${result.studentName}</span></div>
					<div class="card-row"><span class="card-label">Mã SV:</span> <span class="card-value">${result.studentCode}</span></div>
					<div class="card-row"><span class="card-label">Lớp:</span> <span class="card-value">${result.studentClass}</span></div>
					<div class="card-row"><span class="card-label">Trường:</span> <span class="card-value">${result.studentSchool}</span></div>
					<div class="card-row"><span class="card-label">Điểm:</span> <span class="point card-value">${result.point}</span></div>
					<div class="card-row"><span class="card-label">Thời gian:</span> <span class="card-value">${formatTimeMin(result.spentTime)}</span></div>
					<div class="card-row"><span class="card-label">Ngày nộp:</span> <span class="card-value">${formatDateTime(result.submitDate)}</span></div>
					<br>
					<div class="card-row button-row">
						<button onclick="viewStudentExam('${result.studentCode}', '${result.studentName}', '${result.studentClass}', '${result.studentSchool}', '${result.examId || ''}', '${result.id || ''}')" style="padding: 4px 10px; border-radius:6px; background: #2c7be5; color: #fff; border: none; cursor: pointer;">Xem bài thi</button>
						${showMarkBtn ? `<button onclick="markStudentExam('${result.id}', '${result.studentSchool}')" style="margin-left: 6px; padding: 4px 10px; border-radius: 6px; background: #00b894;color:#fff;border:none;cursor:pointer;">Chấm bài</button>` : ''}
					</div>
				</div>
			`;
		}
		// Hiển thị đúng phần theo thiết bị
		if (isMobile) {
			document.getElementById('studentResultTable').style.display = 'none';
			resultList.style.display = 'flex';
		} else {
			document.getElementById('studentResultTable').style.display = '';
			resultList.style.display = 'none';
		}
	}
	// Render phân trang nếu cần
	if (results.length > pageSize) {
		paginationDiv.style.display = 'flex';
		function createBtn(text, page, disabled) {
			return `<button ${disabled ? 'disabled' : ''} onclick="goToPage(${page})" style="padding: 4px 10px; border-radius: 6px; background: #eaf4fb; color: #2c7be5; border: none; cursor: pointer; font-weight: 500;">${text}</button>`;
		}
		window.goToPage = function(page) {
			if (page < 1 || page > totalPages) return;
			currentPage = page;
			renderPage(currentPage);
			renderPagination();
		}
		function renderPagination() {
			let html = '';
			html += createBtn('«', 1, currentPage === 1);
			html += createBtn('‹', currentPage - 1, currentPage === 1);
			html += `<span style="margin:0 8px;">Trang ${currentPage}/${totalPages}</span>`;
			html += createBtn('›', currentPage + 1, currentPage === totalPages);
			html += createBtn('»', totalPages, currentPage === totalPages);
			paginationDiv.innerHTML = html;
		}
		renderPagination();
		renderPage(currentPage);
	} else {
		paginationDiv.style.display = 'none';
		renderPage(currentPage);
	}
}

function viewStudentExam(studentCode, studentName, studentClass, studentSchool, examId, resultId) {
	// Mở modal xem bài thi, truyền mã SV và mã đề vào html/form.html qua query string
	localStorage.setItem('isViewResult', 1);
	localStorage.setItem('isStudent', 1);
	localStorage.setItem('resultId', resultId);
	localStorage.setItem('examId', examId);
	localStorage.setItem('studentName', studentName);
	localStorage.setItem('studentClass', studentClass);
	localStorage.setItem('school', studentSchool);
	var frame = document.getElementById('viewExamFrame');
	frame.src = `html/form.html`;
	document.getElementById('viewExamModal').style.display = 'flex';
	document.getElementById('viewExamTitle').textContent = `Xem bài làm của mã học sinh: ${studentCode}`;
}

function closeViewExamModal() {
	document.getElementById('viewExamModal').style.display = 'none';
	document.getElementById('viewExamFrame').src = '';
}

function isPageReload() {
    const nav = performance.getEntriesByType("navigation")[0];
	console.log(nav);
	if (nav && nav.type === "reload") {
		return true;
	}
    return false;
}      

let studentResults = JSON.parse(localStorage.getItem('studentResults'));
let examId = new URLSearchParams(window.location.search).get('examId');

function showLoadingModal(show) {
	if (document.getElementById('modalLoading')) {
		document.getElementById('modalLoading').style.display = show ? 'flex' : 'none';
	}
}

// end result info

//start js student
async function openExam() {	
	const info = {
		name: document.getElementById('studentName').value.trim(),
		class: document.getElementById('studentClass').value.trim(),
		school: document.getElementById('studentSchool').value.trim(),
		code: document.getElementById('studentCode').value.trim()
	};
	localStorage.setItem('studentInfo', JSON.stringify(info));
	localStorage.setItem('isStudentDoing', 1);

	// Hiệu ứng xoay khi submit
	const spinner = document.getElementById('spinner');
	spinner.style.display = 'inline-block';
	document.getElementById('submitBtn').disabled = true;

	// Lấy mã đề thi từ localStorage hoặc URL
	const examId = localStorage.getItem('examId') || new URLSearchParams(window.location.search).get('id') || '';
	// Gọi API kiểm tra đã thi chưa
	const url = `${ggApiUrl}?action=checkStudentDidExam&studentCode=${encodeURIComponent(info.code)}&studentName=${encodeURIComponent(info.name)}&examId=${encodeURIComponent(examId)}`;
	try {
		const res = await fetch(url);
		const data = await res.json();
		const errorMsg = document.getElementById('errorMsg');
		errorMsg.style.display = 'none';
		if (data === true) {
			errorMsg.textContent = 'Bạn đã thi đề này rồi!';
			errorMsg.style.display = 'block';
			spinner.style.display = 'none';
			document.getElementById('submitBtn').disabled = false;
			return;
		} else {
			localStorage.setItem('isStudentDoing', 0);
			localStorage.setItem('isViewResult', 0);
			localStorage.setItem('isSubmitted', false);
			localStorage.setItem('isReload', 0);
			isSubmitted = false;
			page('/exam');
		}
	} catch (err) {
		const errorMsg = document.getElementById('errorMsg');
		errorMsg.textContent = 'Lỗi kiểm tra trạng thái thi. Vui lòng thử lại!';
		errorMsg.style.display = 'block';
		spinner.style.display = 'none';
		document.getElementById('submitBtn').disabled = false;
	}
}

function checkExam() {
	// Lấy toàn bộ hash, ví dụ: #/result?examId=123
	const hash = window.location.hash;
	// Tách phần query sau dấu ?
	const queryString = hash.split('?')[1] || '';
	const params = new URLSearchParams(queryString);
	const id = params.get("id");
	const subject = params.get("subject");
	if (!id && !subject) {
		alert("Không tìm thấy đề thi hoặc môn học trong URL.");
		localStorage.clear();
        page('/login');
		return;
	}  else {
		localStorage.setItem('isStudent', 1);
		localStorage.setItem('isSubmitted', false);
		fetchExam(id, subject);
	}
}

async function fetchExam(id, subject) {
	document.getElementById('loadingExamModal').style.display = 'flex';
	const url = `${ggApiUrl}?action=getExamById&id=${encodeURIComponent(id)}&subject=${encodeURIComponent(subject)}`;
	try {
		const res = await fetch(url);
		const data = await res.json();
		if (data) {
			localStorage.setItem('examName', data.name || '');
			localStorage.setItem('examTime', data.time || '');
			let form = {
				quiz: { easy: data.easy || 0, medium: data.medium || 0, hard: data.hard || 0 },
				essay: { easy: data.essayEasy || 0, medium: data.essayMedium || 0, hard: data.essayHard || 0 }
			};
			localStorage.setItem('form', JSON.stringify(form));
			localStorage.setItem('grade', data.grade || '');
			localStorage.setItem('school', data.school || '');
			localStorage.setItem('subject', data.subject || '');
			localStorage.setItem('totalQuestions', data.total || 0);                  
			localStorage.setItem('examId', data.id);              
			localStorage.setItem('examType', data.type);

			document.getElementById('studentSchool').value = data.school || '';

			let newQuestions = generatedOptions(data.list || []);
			let examType = data.type || 'quiz';
			let generatedQuestions = generateExamFromQuestions(newQuestions, data.total, form, examType);
			localStorage.setItem('questions', JSON.stringify(generatedQuestions));
			localStorage.setItem('isNewExam', 0);     
		} else {
			
		}
	} catch (e) {
		// Xử lý lỗi nếu cần
		
	} finally {
		document.getElementById('loadingExamModal').style.display = 'none';
	}
}

// end js student

// start js create
function updateTypeInputs() {
	const examTypeSelect = document.getElementById('examType');
	const quizGroup = document.getElementById('quizGroup');
	const essayGroup = document.getElementById('essayGroup');
	if (!examTypeSelect.value) {
		quizGroup.style.display = 'none';
		essayGroup.style.display = 'none';
	} else if (examTypeSelect.value === 'quiz') {
		quizGroup.style.display = '';
		essayGroup.style.display = 'none';
	} else if (examTypeSelect.value === 'essay') {
		quizGroup.style.display = 'none';
		essayGroup.style.display = '';
	} else {
		quizGroup.style.display = '';
		essayGroup.style.display = '';
	}
}

// let user = JSON.parse(localStorage.getItem('user')) || {};
// document.getElementById('teacherName').value = user.name || '';
// localStorage.setItem('teacherName', user.name || '');
// localStorage.setItem('school', user.school || '');
// localStorage.setItem('isStudent', 0);        

async function viewExam(type) {
	const name = document.getElementById('teacherName').value;
	const examName = document.getElementById('examName').value;
	const examType = document.getElementById('examType').value;
	const time = document.getElementById('examTime').value;
	const subject = document.getElementById('subject').value;
	const grade = document.getElementById('grade').value;
	const total = parseInt(document.getElementById('totalQuestions').value);
	let quizEasy = 0, quizMedium = 0, quizHard = 0, essayEasy = 0, essayMedium = 0, essayHard = 0;
	if (examType === 'quiz') {
		quizEasy = parseInt(document.getElementById('quizEasy').value);
		quizMedium = parseInt(document.getElementById('quizMedium').value);
		quizHard = parseInt(document.getElementById('quizHard').value);
	} else if (examType === 'essay') {
		essayEasy = parseInt(document.getElementById('essayEasy').value);
		essayMedium = parseInt(document.getElementById('essayMedium').value);
		essayHard = parseInt(document.getElementById('essayHard').value);
	} else {
		quizEasy = parseInt(document.getElementById('quizEasy').value);
		quizMedium = parseInt(document.getElementById('quizMedium').value);
		quizHard = parseInt(document.getElementById('quizHard').value);
		essayEasy = parseInt(document.getElementById('essayEasy').value);
		essayMedium = parseInt(document.getElementById('essayMedium').value);
		essayHard = parseInt(document.getElementById('essayHard').value);
	}
	const form = {
		quiz: { easy: examType === 'quiz' || examType === 'mix' ? quizEasy : 0, medium: examType === 'quiz' || examType === 'mix' ? quizMedium : 0, hard: examType === 'quiz' || examType === 'mix' ? quizHard : 0 },
		essay: { easy: examType === 'essay' || examType === 'mix' ? essayEasy : 0, medium: examType === 'essay' || examType === 'mix' ? essayMedium : 0, hard: examType === 'essay' || examType === 'mix' ? essayHard : 0 }
	};
	const fileInput = document.getElementById('excelFile');
	const file = fileInput.files[0];
	const btnBank = document.getElementById('btnBank');
	const btnExcel = document.getElementById('btnExcel');
	const iconBank = document.getElementById('iconBank');
	const iconExcel = document.getElementById('iconExcel');

	// Khóa nút và hiện icon xoay
	btnBank.disabled = true;
	btnExcel.disabled = true;
	iconBank.style.display = 'inline-block';
	iconExcel.style.display = 'inline-block';

	try {
		if (type === 0) {
			if (!name || !time || !subject || !grade || !examType) {
				alert("Vui lòng nhập đầy đủ thông tin.");
				return;
			}
		} else if (type === 1) {
			if (!name || !time || !file || !grade || !examType) {
				alert("Vui lòng nhập đầy đủ thông tin.");
				return;
			}
			const allowedExtensions = ['xlsx', 'xls'];
			const fileName = file.name.toLowerCase();
			const isValid = allowedExtensions.some(ext => fileName.endsWith(ext));
			if (!isValid) {
				alert("❌ File không hợp lệ. Vui lòng chọn file .xlsx hoặc .xls");
				return;
			}
		}
		let sum = 0;
		if (examType === 'quiz') {
			sum = form.quiz.easy + form.quiz.medium + form.quiz.hard;
		} else if (examType === 'essay') {
			sum = form.essay.easy + form.essay.medium + form.essay.hard;
		} else {
			sum = form.quiz.easy + form.quiz.medium + form.quiz.hard + form.essay.easy + form.essay.medium + form.essay.hard;
		}
		if (sum > total) {
			alert(`❌ Tổng số câu từng mức (${sum}) lớn hơn tổng số câu (${total})`);
			return;
		} else if (sum < total) {
			alert(`⚠️ Tổng số câu từng mức (${sum}) nhỏ hơn tổng số câu (${total}). Vui lòng điều chỉnh lại.`);
			return;
		}
		async function run() {
			await readFile(file); // chờ xong mới chạy tiếp
		}
		async function getAllQuestions() {
			try {
				const total = parseInt(localStorage.getItem('totalQuestions')) || 40;
				const subject = localStorage.getItem('subject') || "";
				const examType = localStorage.getItem('examType') || "quiz";
				const form = JSON.parse(localStorage.getItem('form') || '{}');
				// const easy = form[examType]?.easy || 0;
				// const medium = form[examType]?.medium || 0;
				// const hard = form[examType]?.hard || 0;
				const response = await fetch(
					ggApiUrl + `?action=generateExam&form=${encodeURIComponent(JSON.stringify(form))}&examType=${encodeURIComponent(examType)}&subject=${encodeURIComponent(subject)}`
				);
				if (!response.ok) throw new Error("Lỗi HTTP: " + response.status);
				const questionss = await response.json();
				// Hiển thị lỗi phía trên button nếu có
				let errorMsg = document.getElementById('errorMsg');
				if (questionss.error) {
					errorMsg.innerHTML = `<span style='color:#d63031;font-weight:600;'>${questionss.error}</span>`;
					return [];
				} else {
					errorMsg.innerHTML = '';
					let newQuestions = generatedOptions(questionss);
					let generatedQuestions = generateExamFromQuestions(newQuestions, total, form, examType);
					// Phân loại câu hỏi trắc nghiệm và tự luận
					const quizQuestions = generatedQuestions.filter(q => q.type === 'quiz' || q.type === 'Trắc nghiệm');
					const essayQuestions = generatedQuestions.filter(q => q.type === 'essay' || q.type === 'Tự luận');
					let finalQuestions = [];
					if (examType === 'mix') {
						finalQuestions = [...quizQuestions, ...essayQuestions];
					} else {
						finalQuestions = [...generatedQuestions];
					}
					localStorage.setItem('questions', JSON.stringify(finalQuestions));
					localStorage.setItem('isNewExam', 1);
					localStorage.setItem('examId', '');

					return generatedQuestions;
				}
			} catch (error) {
				return [];
			}
		}
		localStorage.setItem('isSubmitted', false);
		localStorage.setItem('teacherName', name);
		localStorage.setItem('examName', examName);
		localStorage.setItem('subject', subject);
		localStorage.setItem('grade', grade);
		localStorage.setItem('examTime', time);
		localStorage.setItem('totalQuestions', total);
		localStorage.setItem('form', JSON.stringify(form));
		localStorage.setItem('examType', examType);
		if (type === 0) {
			await getAllQuestions();
		} else if (type === 1) {
			await run();
		}
	} finally {
		btnBank.disabled = false;
		btnExcel.disabled = false;
		iconBank.style.display = 'none';
		iconExcel.style.display = 'none';
	}
}

// end js create

// start js createQuestion
function closePreviewModal() {
	previewModal.style.display = 'none';
	previewContent.innerHTML = '';
}

// Hiện modal kết quả
function showResultModal(msg) {
	document.getElementById('resultModalMsg').textContent = msg;
	document.getElementById('resultModal').style.display = 'flex';
}

// Đóng modal kết quả
function closeResultModal() {
	document.getElementById('resultModal').style.display = 'none';
}

// Hàm Tải lên lên Cloudinary
async function uploadToCloudinary(file, type) {
	const url = 'https://api.cloudinary.com/v1_1/ddzkqkups/' + (type === 'image' ? 'image' : 'audio') + '/upload';
	const formData = new FormData();
	formData.append('file', file);
	formData.append('upload_preset', 'aquiz-app'); // Thay bằng upload_preset của bạn
	try {
		const res = await fetch(url, {
			method: 'POST',
			body: formData
		});
		const data = await res.json();
		if (data.secure_url) {
			return data.secure_url;
		} else {
			throw new Error('Tải lên thất bại');
		}
	} catch (err) {
		return null;
	}
}

function resetForm() {
	document.getElementById('questionForm').reset();
	document.getElementById('mediaInputGroup').style.display = 'none';
	document.getElementById('mediaLabel').textContent = '';
	document.getElementById('mediaFile').style.display = 'none';
	document.getElementById('uploadBtn').style.display = 'none';
	document.getElementById('mediaLink').style.display = 'none';
	document.getElementById('mediaLink').value = '';
}

async function submitQuestionForm() {
	const submitBtn = document.getElementById('submitBtn');
	const submitSpinner = document.getElementById('submitSpinner');
	// Kiểm tra required cho mediaLink nếu có chọn loại media
	const mediaType = document.getElementById('mediaType');
	const mediaLink = document.getElementById('mediaLink');
	const type = document.getElementById('type');
	if (mediaType.value && mediaType.value !== '') {
		if (!mediaLink.value || mediaLink.value.trim() === '') {
			mediaLink.focus();
			showResultModal('Vui lòng nhập hoặc upload link media!');
			e.preventDefault();
			return false;
		}
		// Ràng buộc link YouTube cho video
		if (mediaType.value === 'video') {
			const ytPattern = /^(https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11})/;
			if (!ytPattern.test(mediaLink.value.trim())) {
				mediaLink.focus();
				showResultModal('Chỉ chấp nhận link YouTube!');
				e.preventDefault();
				return false;
			}
		}
	}
	e.preventDefault();
	submitBtn.disabled = true;
	submitSpinner.style.display = 'inline-block';
	// Lấy dữ liệu từ form
	let correct = "";
	let correctId = document.getElementById('correctId').value;
	if (type.value === 'quiz') {
		if (correctId == 1) {
			correct = document.getElementById('answerA').value;
		} else if (correctId == 2) {
			correct = document.getElementById('answerB').value;
		} else if (correctId == 3) {
			correct = document.getElementById('answerC').value;
		} else if (correctId == 4) {
			correct = document.getElementById('answerD').value;
		}
	}
	const data = {
		actionType: 'nhaplieu',
		type: type.value,
		question: document.getElementById('questionContent').value,
		subject: document.getElementById('subject').value,
		grade: document.getElementById('grade').value,
		media: mediaLink.value,
		A: type.value === 'quiz' ? document.getElementById('answerA').value : '',
		B: type.value === 'quiz' ? document.getElementById('answerB').value : '',
		C: type.value === 'quiz' ? document.getElementById('answerC').value : '',
		D: type.value === 'quiz' ? document.getElementById('answerD').value : '',
		correct: type.value === 'quiz' ? correct : '',
		correctId: type.value === 'quiz' ? correctId : '',
		description: document.getElementById('description').value,
		difficulty: document.getElementById('difficulty').value
	};
	// Nếu có type thì truyền vào, ví dụ lấy từ mediaType
	if (mediaType.value) {
		data.type = mediaType.value;
	}
	// Gọi API saveQuestion
	try {
		const apiUrl = typeof ggApiUrl !== 'undefined' ? ggApiUrl : 'YOUR_API_URL_HERE';
		const params = new URLSearchParams({ action: 'saveQuestion', ...data });
		const response = await fetch(apiUrl + '?' + params.toString(), {
			method: 'POST',
		});
		const result = await response.json();
		if (result.success) {
			showResultModal(result.message || 'Lưu câu hỏi thành công!');
			resetForm();
		} else {
			showResultModal(result.message || 'Lưu câu hỏi thất bại!');
		}
	} catch (err) {
		showResultModal('Lỗi khi lưu câu hỏi!');
	}
	submitBtn.disabled = false;
	submitSpinner.style.display = 'none';
}

function setUpCreateQuestionPage() {
	// Xử lý động trường media
	const mediaType = document.getElementById('mediaType');
	const mediaInputGroup = document.getElementById('mediaInputGroup');
	const mediaLabel = document.getElementById('mediaLabel');
	const mediaFile = document.getElementById('mediaFile');
	const uploadBtn = document.getElementById('uploadBtn');
	const mediaLink = document.getElementById('mediaLink');
	const previewBtn = document.getElementById('previewBtn');
	const previewModal = document.getElementById('previewModal');
	const previewContent = document.getElementById('previewContent');
	
	mediaType.addEventListener('change', function() {
		if (mediaType.value === 'video') {
			mediaInputGroup.style.display = 'block';
			mediaLabel.textContent = 'Dán link video (Youtube, Vimeo...)';
			mediaFile.style.display = 'none';
			uploadBtn.style.display = 'none';
			mediaLink.style.display = 'block';
			mediaLink.value = '';
			mediaLink.placeholder = 'Dán link video...';
			previewBtn.style.display = 'none';
		} else if (mediaType.value === 'image' || mediaType.value === 'audio') {
			mediaInputGroup.style.display = 'block';
			mediaLabel.textContent = mediaType.value === 'image' ? 'Tải lên hình ảnh' : 'Tải lên âm thanh';
			mediaFile.style.display = 'block';
			uploadBtn.style.display = 'inline-block';
			mediaLink.style.display = 'block';
			mediaLink.value = '';
			mediaLink.placeholder = 'Link sau khi tải lên...';
			mediaFile.value = '';
			if (mediaType.value === 'image') {
				mediaFile.accept = 'image/*';
				previewBtn.style.display = 'inline-block';
			} else {
				mediaFile.accept = 'audio/*';
				previewBtn.style.display = 'none';
			}
		} else {
			mediaInputGroup.style.display = 'none';
			mediaLabel.textContent = '';
			mediaFile.style.display = 'none';
			uploadBtn.style.display = 'none';
			mediaLink.style.display = 'none';
			mediaLink.value = '';
			mediaFile.value = '';
			previewBtn.style.display = 'none';
		}
	});

	mediaType.addEventListener('change', function() {
		if ((mediaType.value === 'image' || mediaType.value === 'video') && mediaLink.value.trim() !== '') {
			previewBtn.style.display = 'inline-block';
		} else {
			previewBtn.style.display = 'none';
		}
	});

	mediaLink.addEventListener('input', function() {
		if ((mediaType.value === 'image' || mediaType.value === 'video') && mediaLink.value.trim() !== '') {
			previewBtn.style.display = 'inline-block';
		} else {
			previewBtn.style.display = 'none';
		}
	});

	previewBtn.onclick = function() {
		const url = mediaLink.value.trim();
		if (!url) return;
		if (mediaType.value === 'image') {
			previewContent.innerHTML = `<img src="${url}" alt="Preview" style="max-width:80vw; max-height:70vh; border-radius:8px; margin-bottom:18px;" />`;
		} else if (mediaType.value === 'video') {
			// Chỉ cho xem trước nếu là link YouTube
			const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
			if (!ytMatch) {
				showResultModal('Chỉ chấp nhận link YouTube!');
				return;
			}
			const embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
			previewContent.innerHTML = `<iframe width="560" height="315" src="${embedUrl}" frameborder="0" allowfullscreen style="max-width:80vw; max-height:70vh; border-radius:8px; margin-bottom:18px;"></iframe>`;
		}
		previewModal.style.display = 'flex';
	}
	
	// Xử lý Tải lên file (demo: chỉ gen link local, thực tế cần Tải lên lên server)
	uploadBtn.addEventListener('click', async function() {
		if (!mediaFile.files[0]) {
			showResultModal('Vui lòng chọn file trước!');
			return;
		}
		const file = mediaFile.files[0];
		const type = mediaType.value;
		mediaLink.value = '';
		uploadBtn.disabled = true;
		uploadBtn.innerHTML = '<span class="modern-spinner" style="display:inline-block;"></span> Đang tải lên...';
		const url = await uploadToCloudinary(file, type);
		uploadBtn.disabled = false;
		uploadBtn.innerHTML = 'Tải lên';
		if (url) {
			mediaLink.value = url;
			showResultModal('Tải lên thành công!');
		} else {
			showResultModal('Tải lên thất bại!');
		}
	});
	
	document.getElementById('homeBtn').onclick = function() {
		const homeBtn = document.getElementById('homeBtn');
		const homeSpinner = document.getElementById('homeSpinner');
		homeBtn.disabled = true;
		homeSpinner.style.display = 'inline-block';
		setTimeout(function() {			
            page('/login');
		}, 600);
	};

	// Xử lý hiển thị đáp án theo loại câu hỏi
	const questionType = document.getElementById('type');
	const answerRows = document.querySelectorAll('.answer-row');
	const correctIdSelect = document.getElementById('correctId');
	questionType.addEventListener('change', function() {
		if (questionType.value === 'essay') {
			answerRows.forEach(row => {
				const input = row.querySelector('input');
				if (input) {
					input.value = '';
					input.disabled = true;
				}
				row.style.display = 'none';
			});
			correctIdSelect.value = '';
			correctIdSelect.disabled = true;
			correctIdSelect.parentElement.style.display = 'none';
		} else {
			answerRows.forEach(row => {
				const input = row.querySelector('input');
				if (input) {
					input.disabled = false;
				}
				row.style.display = '';
			});
			correctIdSelect.disabled = false;
			correctIdSelect.parentElement.style.display = '';
		}
	});
}

// end js createQuestion

// start js load

function viewImageModal() {
	var url = document.getElementById('media').value.trim();
	var modal = document.getElementById('imageModal');
	var content = document.getElementById('imageModalContent');
	if (!url) {
		content.innerHTML = '<span style="color:#d63031;">Không có link ảnh!</span>';
	} else {
		content.innerHTML = `<img src="${url}" alt="Media" style="max-width: 100%; max-height: 400px; border-radius: 8px; box-shadow: 0 2px 8px rgba(44,123,229,0.12);" />`;
	}
	modal.style.display = 'flex';
}

function closeImageModal() {
	document.getElementById('imageModal').style.display = 'none';
	document.getElementById('imageModalContent').innerHTML = '';
}

function viewDraftToPrint() {
	localStorage.setItem('isViewResult', 0);
	document.getElementById('draftFrame').src = 'html/form.html';
	document.getElementById('draftModal').style.display = 'flex';
}

function closeDraftModal() {
	document.getElementById('draftModal').style.display = 'none';
	document.getElementById('draftFrame').src = '';
}

let questionsList = [];
let currentIndex = -1;

function loadFromJSON(data) {
	if (data.length > 0) {					
		questionsList = data.map(q => {
			// Nếu correct là context, xác định đúng là A/B/C/D
			let correct = "";   
			if (q.correctId == (q.options?.[0]?.id)) correct = "A";
			else if (q.correctId == (q.options?.[1]?.id)) correct = "B";
			else if (q.correctId == (q.options?.[2]?.id)) correct = "C";
			else if (q.correctId == (q.options?.[3]?.id)) correct = "D";
			else correct = ""; // Không khớp đáp án nào

			return {
				id: q.id,
				question: q.question,
				type: q.type || "",
				subject: q.subject || "",
				grade: q.grade || "",
				media: q.media || "",
				A: q.options?.[0]?.context || q.A || "",
				B: q.options?.[1]?.context || q.B || "",
				C: q.options?.[2]?.context || q.C || "",
				D: q.options?.[3]?.context || q.D || "",
				correct: correct,
				description: q.description || "",
				difficulty: q.difficulty || "dễ"
			};
		});
		renderList();
		selectQuestion(0);
	}
}

function renderList() {
	const container = document.getElementById("listContainer");
	container.innerHTML = "";
	questionsList.forEach((q, i) => {
		const div = document.createElement("div");
		div.className = "q-item" + (i === currentIndex ? " active" : "");
		div.innerHTML = `<b>${q.id || `Q${i + 1}`}</b>. ${q.question}`;
		div.onclick = () => selectQuestion(i);
		container.appendChild(div);
	});
}

function addQuestion() {
	const newQuestion = {
		id: `Q${questionsList.length + 1}`,
		question: "",
		subject: "",
		type: "",
		grade: "",
		media: "",
		A: "",
		B: "",
		C: "",
		D: "",
		correct: "",
		description: "",
		difficulty: "dễ"
	};
	questionsList.push(newQuestion);
	selectQuestion(questionsList.length - 1);
}

function selectQuestion(index) {
	currentIndex = index;
	const q = questionsList[index];
	document.getElementById('id').value = q.id || '';
	// Bind dữ liệu trường type theo if else
	if (q.type) {
		if (q.type == "quiz") {
			document.getElementById('type').value = "Trắc nghiệm";
		} else if (q.type == "essay") {
			document.getElementById('type').value = "Tự luận";
		}
	} else {
		document.getElementById('type').value = '';
	}

	document.getElementById('question').value = q.question || '';
	document.getElementById('subject').value = q.subject || '';
	document.getElementById('grade').value = q.grade || '';
	document.getElementById('media').value = q.media || '';
	document.getElementById('A').value = q.A || '';
	document.getElementById('B').value = q.B || '';
	document.getElementById('C').value = q.C || '';
	document.getElementById('D').value = q.D || '';
	document.getElementById('correct').value = q.correct || '';

	// Ẩn/hiện các trường đáp án trắc nghiệm nếu là tự luận
	const isEssay = q.type === 'essay' || document.getElementById('type').value === 'Tự luận';
	['A','B','C','D','correct'].forEach(id => {
		const label = document.querySelector('label[for="' + id + '"]') || document.querySelector('label[for="' + id.toUpperCase() + '"]');
		const field = document.getElementById(id);
		if (label) label.style.display = isEssay ? 'none' : '';
		if (field) field.style.display = isEssay ? 'none' : '';
	});
	document.getElementById('description').value = q.description || '';
	document.getElementById('difficulty').value = q.difficulty || 'easy';
	renderList();
}

function updateCurrent() {
	if (currentIndex === -1) return;
	const q = questionsList[currentIndex];
	q.id = document.getElementById("id").value;
	q.question = document.getElementById("question").value;
	q.subject = document.getElementById("subject").value;
	q.type = document.getElementById("type").value;
	q.grade = document.getElementById("grade").value;
	q.media = document.getElementById("media").value;
	q.A = document.getElementById("A").value;
	q.B = document.getElementById("B").value;
	q.C = document.getElementById("C").value;
	q.D = document.getElementById("D").value;
	// Khi lưu đáp án đúng, chuyển từ A/B/C/D thành 1/2/3/4
	let correctVal = document.getElementById("correct").value.toUpperCase();
	if (correctVal === "A") q.correct = 1;
	else if (correctVal === "B") q.correct = 2;
	else if (correctVal === "C") q.correct = 3;
	else if (correctVal === "D") q.correct = 4;
	else q.correct = correctVal;
	q.description = document.getElementById("description").value;
	q.difficulty = document.getElementById("difficulty").value;
	renderList();
}

function generateJSON() {
	const output = questionsList.map((q, index) => {
		const correctMap = {
			A: "1",
			B: "2",
			C: "3",
			D: "4"
		};
		const correct = correctMap[q.correct] || "";
		return {
			id: q.id || `Q${index + 1}`,
			question: q.question,
			subject: q.subject || "",
			type: q.type || "",
			grade: q.grade || "",
			media: q.media || "",
			options: [{
				context: q.A || "",
				id: 1
			}, {
				context: q.B || "",
				id: 2
			}, {
				context: q.C || "",
				id: 3
			}, {
				context: q.D || "",
				id: 4
			}],
			correct,
			description: q.description || "",
			difficulty: q.difficulty
		};
	});
}
        
function disableAllButtons() {
	document.querySelectorAll('button').forEach(btn => btn.disabled = true);
}

function enableAllButtons() {
	document.querySelectorAll('button').forEach(btn => btn.disabled = false);
}

function showResultModal(title, content) {
	document.getElementById('resultTitle').innerText = title;
	document.getElementById('resultContent').innerHTML = content;
	document.getElementById('resultModal').style.display = 'flex';
}

function closeResultModal() {
	document.getElementById('resultModal').style.display = 'none';
}

function saveExam() {
	const btn = document.getElementById('btnSaveExam');
	const icon = document.getElementById('iconSaveExam');
	disableAllButtons();
	icon.style.display = 'inline-block';
	
	// Tùy chỉnh logic lưu đề thi tại đây
	let user = JSON.parse(localStorage.getItem('user')) || {};
	let form = JSON.parse(localStorage.getItem('form') || '{}');
	let type = localStorage.getItem('examType') || '';
	let listQ = '';
	let examType = '';
	questionsList.forEach(q => {
		if (listQ == '') {
			listQ = q.id;
		} else {
			listQ += `,${q.id}`;
		} 
	});
	if (type == 'quiz') {
		examType = 'Trắc nghiệm';
	} else if (type == 'essay') {
		examType = 'Tự luận';
	} else if (type == 'mix') {
		examType = 'Trắc nghiệm + Tự luận';
	}
	const examData = {
		action: 'saveExam',
		name: localStorage.getItem('examName') || '',
		type: examType || '',
		teacherId: user.id || '',
		school: localStorage.getItem('school') || '',
		subject: localStorage.getItem('subject') || '',
		grade: localStorage.getItem('grade') || '',
		time: localStorage.getItem('examTime') || '',
		total: localStorage.getItem('totalQuestions') || '',
		form: JSON.stringify(form) || '',
		list: JSON.stringify(listQ) || '',
		schoolLevel: user.schoolLevel || ''
	};
	// Gọi API lưu đề thi
	fetch(ggApiUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams(examData)
	})
	.then(res => res.json())
	.then(data => {
		if (data.success) {
			showResultModal('Lưu đề thi thành công', 'Đề thi đã được lưu!');
			localStorage.setItem('isChange', 1);
			localStorage.setItem('isNewExam', 0);
			localStorage.setItem('examId', data.id || '');
			const btn = document.getElementById('btnSaveExam');
			btn.classList.add('btn-disabled');
			document.getElementById('afterSaveBtns').style.display = 'flex';
		} else {
			showResultModal('Lỗi lưu đề thi', data.message || 'Lưu đề thi thất bại!');
		}
	})
	.catch(() => {
		showResultModal('Lỗi lưu đề thi', 'Lưu đề thi thất bại!');
	})
	.finally(() => {
		enableAllButtons();
		icon.style.display = 'none';
	});
}    

function copyExamLink() {
	let examId = localStorage.getItem('examId') || '';
	let subject = localStorage.getItem('subject') || '';
	if (!examId) {
		showCopyLinkModal('Không tìm thấy ID đề thi!');
		return;
	}
	const link = window.location.origin + '/#!/student?id=' + examId + '&subject=' + subject;
	navigator.clipboard.writeText(link).then(() => {
		showCopyLinkModal('Đã copy link đề thi:<br><span style="word-break:break-all;color:#2c7be5;font-weight:500;">' + link + '</span>');
	}, () => {
		showCopyLinkModal('Không thể copy link. Link:<br><span style="word-break:break-all;color:#d63031;font-weight:500;">' + link + '</span>');
	});
}

function closeCopyLinkModal() {
	document.getElementById('copyLinkModal').style.display = 'none';
}

function disableAllFields() {
	var editor = document.getElementById('editor');
	if (!editor) return;
	var fields = editor.querySelectorAll('input, select, textarea');
	fields.forEach(function(field) {
		field.disabled = true;
	});
}
        
// end js load

//start js form
// Hàm render đề thi sau khi lấy xong dữ liệu
function renderExam(questionss) {
    const isViewResult = localStorage.getItem('isViewResult');
	let questionList = '';
	if (questionss.length > 0) {
		// Phân loại câu hỏi
		const quizQuestions = questionss.filter(q => q.type === 'quiz' || q.type === 'Trắc nghiệm');
		const essayQuestions = questionss.filter(q => q.type === 'essay' || q.type === 'tự luận');
		const examType = localStorage.getItem('examType') || '';
		if (isViewResult == 1) {
			document.getElementsByClassName('bailam-title')[0].textContent = 'BÀI LÀM';
		} else {
			document.getElementsByClassName('bailam-title')[0].textContent = 'ĐỀ BÀI';
		}
		// Luôn hiển thị phần tự luận khi xem lại kết quả (isViewResult == 1)
		if (examType === 'essay' || examType === 'Tự luận') {
			essayQuestions.forEach((ques, index) => {
				questionList += `<div class="question">`;
				questionList += `<p><b>Câu hỏi ${index + 1}: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</b>${ques.question}</p>`;
				if (isViewResult == 1 && ques.userAnswer) {
					questionList += `<div style='margin: 8px 0 0 16px;'><b>Trả lời:</b> <span style='background: #f8f9fa; padding: 6px 12px; border-radius: 6px; color: #3498db;'>${ques.userAnswer}</span></div>`;
				}
				questionList += `</div>`;
			});
		} else if (examType === 'mix' || examType === 'Trắc nghiệm + Tự luận') {
			if (quizQuestions.length > 0) {
				questionList += `<div class='bailam-title' style='margin-top:24px;'>PHẦN 1: TRẮC NGHIỆM</div>`;
				quizQuestions.forEach((ques, index) => {
					questionList += `<div class="question">`;
					questionList += `<p><b>Câu hỏi ${index + 1}: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</b>${ques.question}</p>`;
					questionList += `<ul class="options">`;
					ques.options.forEach((opt, ind) => {
						let label = '';
						switch (ind) {
							case 0: label = 'A. '; break;
							case 1: label = 'B. '; break;
							case 2: label = 'C. '; break;
							case 3: label = 'D. '; break;
						}
						let cssClass = '';
						if (isViewResult == 1) {
							if (opt.id === ques.correctId) {
								cssClass = 'option-correct';
							}
							if (!ques.userAnswer || ques.userAnswer === null || ques.userAnswer === undefined || ques.userAnswer === '') {
								if (opt.id === ques.correctId) cssClass = 'option-correct-empty';
							} else if (opt.context === ques.userAnswer) {
								if (opt.id === ques.correctId) cssClass = 'option-correct';
								else cssClass = 'option-user';
							}
						}
						questionList += `<li class='${cssClass.trim()}'>${label}${opt.context}</li>`;
					});
					questionList += `</ul>`;
					questionList += `</div>`;
				});
			}
			if (essayQuestions.length > 0) {
				questionList += `<div class='bailam-title' style='margin-top:24px;'>PHẦN 2: TỰ LUẬN</div>`;
				essayQuestions.forEach((ques, index) => {
					questionList += `<div class="question">`;
					questionList += `<p><b>Câu hỏi ${index + 1}: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</b>${ques.question}</p>`;
					if (isViewResult == 1 && ques.userAnswer) {
						questionList += `<div style='margin: 8px 0 0 16px;'><b>Trả lời:</b> <span style='background: #f8f9fa; padding: 6px 12px; border-radius: 6px; color: #3498db;'>${ques.userAnswer}</span></div>`;
					}
					questionList += `</div>`;
				});
			}
		} else {
			// Đề trắc nghiệm: như cũ
			quizQuestions.forEach((ques, index) => {
				questionList += `<div class="question">`;
				questionList += `<p><b>Câu hỏi ${index + 1}: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</b>${ques.question}</p>`;
				questionList += `<ul class="options">`;
				ques.options.forEach((opt, ind) => {
					let label = '';
					switch (ind) {
						case 0: label = 'A. '; break;
						case 1: label = 'B. '; break;
						case 2: label = 'C. '; break;
						case 3: label = 'D. '; break;
					}
					let cssClass = '';
					if (isViewResult == 1) {
						if (opt.id === ques.correctId) {
							cssClass = 'option-correct';
						}
						if (!ques.userAnswer || ques.userAnswer === null || ques.userAnswer === undefined || ques.userAnswer === '') {
							if (opt.id === ques.correctId) cssClass = 'option-correct-empty';
						} else if (opt.context === ques.userAnswer) {
							if (opt.id === ques.correctId) cssClass = 'option-correct';
							else cssClass = 'option-user';
						}
					}
					questionList += `<li class='${cssClass.trim()}'>${label}${opt.context}</li>`;
				});
				questionList += `</ul>`;
				questionList += `</div>`;
			});
			// Nếu đang xem lại kết quả và có câu tự luận thì vẫn hiển thị phần tự luận
			if (isViewResult == 1 && essayQuestions.length > 0) {
				// questionList += `<div class='bailam-title' style='margin-top:24px;'>PHẦN TỰ LUẬN</div>`;
				essayQuestions.forEach((ques, index) => {
					questionList += `<div class="question">`;
					questionList += `<p><b>Câu hỏi ${index + 1}: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</b>${ques.question}</p>`;
					if (ques.userAnswer) {
						questionList += `<div style='margin: 8px 0 0 16px;'><b>Trả lời:</b> <span style='background: #f8f9fa; padding: 6px 12px; border-radius: 6px; color: #3498db;'>${ques.userAnswer}</span></div>`;
					}
					questionList += `</div>`;
				});
			}
		}
	}
	let listQuestion = document.getElementById('list-question');
	listQuestion.innerHTML = questionList;
}

// Hàm khởi động: gọi API, show/hide loading, render giao diện
async function initExamView() {
	document.getElementById('modalLoading').style.display = 'flex';
	document.getElementById('exam-content').style.display = 'none';
    const isViewResult = localStorage.getItem('isViewResult');
	let questionss = [];
	if (isViewResult == 1) {
		let examId = localStorage.getItem('examId') || '';
		let subjectId = localStorage.getItem('subject') || '';
		let resultId = localStorage.getItem('resultId') || '';
		
		const url = `${ggApiUrl}?action=getExamWithAnswer&examId=${encodeURIComponent(examId)}&subject=${encodeURIComponent(subjectId)}&resultId=${encodeURIComponent(resultId)}`;
		try {
			const res = await fetch(url);
			const data = await res.json();
			// Gán userAnswer cho từng câu hỏi nếu có trường answer từ API
			if (Array.isArray(data.list) && Array.isArray(data.answer)) {
				const answerMap = {};
				data.answer.forEach(a => {
					if (a.questionId) answerMap[a.questionId] = a.userAnswer;
				});
				data.list = data.list.map(q => {
					return { ...q, userAnswer: answerMap[q.id] || q.userAnswer || '' };
				});
			}
			let newQuestions = generatedOptions(data.list);
			let generatedQuestions = generateExamFromQuestions(newQuestions, data.total, data.form, data.type);

			questionss = generatedQuestions || [];
			localStorage.setItem('questions', JSON.stringify(questionss));
			renderExam(questionss);
			// Hiển thị điểm nếu có
			if (typeof data.point !== 'undefined') {
				document.getElementById('studentPoint').textContent = data.point;
				document.getElementById('pointView').style.display = 'block';
			}
		} catch (err) {
			questionss = [];
		}
	} else if (isViewResult == 0) {
		questionss = JSON.parse(localStorage.getItem('questions')) || [];
		renderExam(questionss);
		document.getElementById('pointView').style.display = 'none';
	}
	document.getElementById('modalLoading').style.display = 'none';
	document.getElementById('exam-content').style.display = 'block';

	let subject = '';
	const subjectSelect = localStorage.getItem('subject') || '';
	if (subjectSelect) {
		subjects.forEach(sub => {
			if (sub.value === subjectSelect) {
				subject = sub.text;
			}
		});
	}

	document.getElementById('timeForm').textContent = localStorage.getItem('examTime') || '';
	document.getElementById('subjectForm').textContent = subject;
	document.getElementById('schoolForm').textContent = localStorage.getItem('school') || '';

	if (isViewResult == 1) {
		document.getElementById('studentNameForm').textContent = localStorage.getItem('studentName') || '';
		document.getElementById('studentClassForm').textContent = localStorage.getItem('studentClass') || '';
	} else {
		document.getElementById('studentNameForm').textContent = '................................................................................';
		document.getElementById('studentClassForm').textContent = '................................................................................';
	}
}

function downloadPDF() {
	const element = document.getElementById('exam-content');
    const isViewResult = localStorage.getItem('isViewResult');
	let fileName = '';
	if (isViewResult == 1) {
		fileName = localStorage.getItem('examName') + ' - ' + localStorage.getItem('studentName') + '.pdf';
	} else {
		fileName = localStorage.getItem('examName') + '.pdf';
	}
	const opt = {
		margin: 0.5,
		filename: fileName,
		image: { 
			type: 'jpeg', 
			quality: 0.98 
		},
		html2canvas:  {
			scale: 1.5,
			scrollY: 0
		},
		jsPDF: {
			unit: 'in',
			format: 'a4',
			orientation: 'portrait'
		}
	};

	// Cho delay 100ms để đảm bảo DOM render xong
	setTimeout(() => {
		html2pdf().set(opt).from(element).save();
	}, 100);
}
// end js form

// start js exam

function initExamPage() {
	if (!localStorage.getItem('isSubmitted') || localStorage.getItem('isSubmitted') === 'false' || localStorage.getItem('isSubmitted') === '0') {
		let questions = JSON.parse(localStorage.getItem('questions')) || [];
		questions.forEach(q => { q.userAnswer = ''; });
		localStorage.setItem('questions', JSON.stringify(questions));
	}
	initNav(); // Hiển thị trước nav
	showQuestion(0); // Hiển thị ô đầu
	loadQuestions(); // Lấy dữ liệu

	// Bind dữ liệu studentInfo nếu có
	const studentInfo = JSON.parse(localStorage.getItem('studentInfo') || '{}');
	if (studentInfo && studentInfo.name) {
		const nameEls = document.querySelectorAll('#studentName');
		const codeEls = document.querySelectorAll('#studentCode');
		const schoolEls = document.querySelectorAll('#studentSchool');
		const classEls = document.querySelectorAll('#studentClass');
		const subjectEls = document.querySelectorAll('#studentSubject');
		
		nameEls.forEach(el => el.textContent = studentInfo.name || '-');
		codeEls.forEach(el => el.textContent = studentInfo.code || '-');
		schoolEls.forEach(el => el.textContent = studentInfo.school || '-');
		classEls.forEach(el => el.textContent = studentInfo.class || '-');
		subjects.forEach(sub => {
			if (sub.value === localStorage.getItem('subject')) {
				subjectEls.forEach(el => el.textContent = sub.text || '-');
			}
		});
	}

	if (localStorage.getItem('isSubmitted')) {
		showQuestion(0);
		updateAnsweredNav();
	}
	
	if (isSubmitted) {
		timerDuration = 0;
	} else {
		timerDuration = parseInt(localStorage.getItem('examTime')) * 60;
	}
	const examId = localStorage.getItem('examId');
	const btnNewExam = document.getElementById('btnNewExam');
	if (!examId) {
		btnNewExam.style.display = 'inline-block';
	} else {
		btnNewExam.style.display = 'none';
	}
}
// end js exam

// Tự động khởi tạo khi mở form.html (dùng cho iframe hoặc mở trực tiếp)
if (window.location.pathname.endsWith('form.html')) {
	document.addEventListener('DOMContentLoaded', function() {
		if (typeof initExamView === 'function') initExamView();
	});
}