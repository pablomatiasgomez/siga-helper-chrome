let ProfessorsSearchCustomPage = function ($container, services) {

	// noinspection JSNonASCIINames,SpellCheckingInspection,NonAsciiCharacters
	const TEXT_QUESTIONS = {
		// Good:
		"Mencione las características del docente que ayudaron en su  aprendizaje": "#19B135",
		"Mencione las características del auxiliar docente que ayudaron en su aprendizaje": "#19B135",
		// Neutral:
		"Realice las observaciones y aclaraciones que crea convenientes sobre  las puntuaciones asignadas": "#000000",
		"Realice las observaciones que crea conveniente.": "#000000",
		// Bad:
		"Mencione los aspectos del proceso de enseñanza que deberían mejorarse": "#D51C26",
		"Mencione los aspectos del proceso de enseñanza referidos a los trabajos Prácticos del aula, que pueden mejorarse.": "#D51C26",
	};

	let $searchDiv;
	let $searchResultsDiv;
	let $professorResultsTitleDiv; // Just the title with the professor name.
	let $coursesResultDiv; // Shows the last courses in which the professor was present
	let $surveyResultDiv; // Shows the survey results of the given professor

	let createPage = function () {
		$searchDiv = $("<div></div>");
		$searchDiv.append(`<span class="bold">Buscar docente: </span>`);
		let $searchTxt = $(`<input type="text" style="margin: 0 5px 0 0;" placeholder="Minimo 3 caracteres..." />`);
		$searchTxt.on("keydown", function (e) {
			if (e.key === "Enter") {
				search($searchTxt.val());
				return false;
			}
		});
		$searchDiv.append($searchTxt);
		let $searchBtn = $(`<a href="#" class="btn btn-info btn-small">Buscar</a>`);
		$searchBtn.on("click", function () {
			search($searchTxt.val());
			return false;
		});
		$searchDiv.append($searchBtn);
		$searchDiv.append("<hr>");
		$container.append($searchDiv);

		$searchResultsDiv = $(`<div></div>`);
		$searchResultsDiv.hide();
		$searchResultsDiv.append("<h2>Resultados de busqueda</h2>");
		let $searchResultsTable = $(`<table class="table table-bordered table-condensed table-hover"></table>`).append("<tbody></tbody>");
		$searchResultsTable.on("click", "a", function () {
			let professorName = $(this).text();
			retrieveProfessorData(professorName);
			return false;
		});
		$searchResultsDiv.append($searchResultsTable);
		$searchResultsDiv.append("<hr>");
		$container.append($searchResultsDiv);

		$professorResultsTitleDiv = $(`<div></div>`);
		$container.append($professorResultsTitleDiv);
		$coursesResultDiv = $(`<div></div>`);
		$container.append($coursesResultDiv);
		$surveyResultDiv = $(`<div></div>`);
		$container.append($surveyResultDiv);
	};

	let search = function (query) {
		if (query.length < 3) return;
		hideProfessorData();
		$searchResultsDiv.show().get(0).scrollIntoView({behavior: "smooth"});
		$searchResultsDiv.hide();
		return services.apiConnector.searchProfessors(query).then(results => {
			let trs = results.map(item => {
				return `<tr><td><a href="#">${item.value}</a></td><td>${item.data}</td></tr>`;
			}).join("");
			$searchResultsDiv.show();
			$searchResultsDiv.find("table tbody")
				.html(trs)
				.prepend("<tr><th>Profesor</th><th>Cantidad de encuestas</th></tr>");
		});
	};

	let hideProfessorData = function () {
		$professorResultsTitleDiv.hide();
		$coursesResultDiv.hide();
		$surveyResultDiv.hide();
	};

	let retrieveProfessorData = function (professorName) {
		$professorResultsTitleDiv.show().get(0).scrollIntoView({behavior: "smooth"});
		$professorResultsTitleDiv.html(`<h2 style="text-align: center;">Resultados para ${professorName}:</h2><hr>`);
		retrieveProfessorCourses(professorName);
		retrieveSurveyResults(professorName);
	};

	let retrieveProfessorCourses = function (professorName) {
		$coursesResultDiv.hide();
		// For now we are showing just the latest 20 classes.
		return services.apiConnector.getClassesForProfessor(professorName, 0, 20).then(classSchedules => {
			$coursesResultDiv.html("");
			let trs = classSchedules.map(classSchedule => {
				let professorLis = (classSchedule.professors || []).map(professor => {
					return services.utils.getProfessorLi(professor);
				}).join("");
				return `<tr>
					<td>${classSchedule.year}</td>
					<td>${classSchedule.quarter}</td>
					<td><a class="no-ajax" href="${CustomPages.getCourseResultsUrl(classSchedule.courseCode)}" target="_blank">${classSchedule.courseName}</a></td>
					<td>${classSchedule.classCode}</td>
					<td>${classSchedule.branch || "-"}</td>
					<td>${services.utils.getTimeInfoStringFromSchedules(classSchedule.schedules)}</td>
					<td><ul class="no-margin">${professorLis}</ul></td>
				</tr>`;
			}).join("");
			$coursesResultDiv.append(`
				<h3>Ultimos cursos en los que estuvo presente:</h3>
				<table class="table table-bordered table-condensed table-hover">
					<tbody>
						<tr><th colspan="2">Cuatr.</th><th>Materia</th><th>Curso</th><th>Anexo</th><th>Horario</th><th>Profesores</th></tr>
						${trs}
					</tbody>
				</table>
			`);
			$coursesResultDiv.append(`<hr>`);
			$coursesResultDiv.show();
		});
	};

	let retrieveSurveyResults = function (professorName) {
		$surveyResultDiv.hide();
		return services.apiConnector.getProfessorSurveysAggregate(professorName).then(response => {
			$surveyResultDiv.html("");
			Object.entries(response)
				// Put DOCENTE before AUXILIAR
				.sort((a, b) => (a[0] > b[0] ? -1 : 1))
				.forEach(entry => appendSurveyResults(entry[0], entry[1]));
			$surveyResultDiv.show();
		});
	};

	let appendSurveyResults = function (surveyKind, results) {
		$surveyResultDiv.append(`<h3>Encuesta de tipo: ${surveyKind}</h3>`);

		if (results.percentageFields.length) {
			let percetangeRows = results.percentageFields.map(item => {
				return `<tr><td>${item.question}</td><td style="background-color: ${services.utils.getColorForAvg(item.average)}">${item.average}</td><td>${item.count}</td></tr>`;
			}).join("");
			$surveyResultDiv.append(`
				<h4>Puntaje general: ${services.utils.getOverallScoreSpan(results.overallScore)}</h4>
				<table class="percentage-questions table table-bordered table-condensed table-hover">
					<tbody>
						<tr><th>Pregunta</th><th>Promedio</th><th>Muestra</th></tr>
						${percetangeRows}
					</tbody>
				</table>
			`);
		}

		let textQuestions = Object.keys(TEXT_QUESTIONS).filter(question => results.textFields[question] && results.textFields[question].length);
		if (textQuestions.length) {
			let textColumns = textQuestions.map(question => {
				let answers = results.textFields[question].map(answer => `<i>"${answer}"</i>`).join(`<hr style="margin: 8px 0;">`);
				return `<td style="color: ${TEXT_QUESTIONS[question]}">${answers}</td>`;
			}).join("");
			$surveyResultDiv.append(`
				<h4>Comentarios:</h4>
				<table class="text-questions table table-bordered table-condensed table-hover" style="table-layout: fixed; width: 100%;">
					<tbody>
						<tr>${textQuestions.map(question => `<th>${question}</th>`).join("")}</tr>
						<tr>${textColumns}</tr>
					</tbody>
				</table>
			`);
		}
		$surveyResultDiv.append(`<hr>`);
	};

	// Init
	return Promise.resolve().then(() => {
		createPage();
		let professorName = new URLSearchParams(window.location.search).get(ProfessorsSearchCustomPage.customParamKey);
		if (professorName) {
			return retrieveProfessorData(professorName);
		}
	});
};

ProfessorsSearchCustomPage.menuName = "Buscar docentes";
ProfessorsSearchCustomPage.customParamKey = "professorName";
