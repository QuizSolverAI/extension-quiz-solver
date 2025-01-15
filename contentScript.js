var openaiApiKey;
var targetWebsite;
chrome.storage.sync.get('APIkey', ({ APIkey }) => {
  openaiApiKey = APIkey
  if (openaiApiKey == null || openaiApiKey == '') {
    displayAnswer('Please enter your OpenAI API key in the extension options');
    disableAction(true);
    return;
  } else {
    chrome.storage.sync.get('targetWeb', ({ targetWeb }) => {
      console.log(targetWeb);
      if (targetWeb == null || targetWeb == '') {
        displayAnswer('Please enter your target website in the extension options');
        disableAction(true);
        return;
      } else {
        targetWebsite = targetWeb;
        disableAction(false);
        displayAnswer('');
      }

    });
  }
});
function disableAction(disable) {
  var btns = document.querySelectorAll('.btn-answer');
  for (var i = 0; i < btns.length; i++) {
    if (btns[i] != null)
      btns[i].disabled = disable;
  }
}

function delete_elements(el) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(el, "text/html");

  const elementToRemove = doc.querySelector('.visually-hidden');
  if (elementToRemove) {
    elementToRemove.remove();
  }
  return doc.body;
}

function displayAnswer(answer) {
  //console.log(openaiApiKey);
  let CSSelement = document.getElementById('hack-style');
  if (CSSelement == null) {
    const style = document.createElement('style');
    style.setAttribute("id", "hack-style");
    style.innerHTML = ` 
      #hack-answer {
        background-color: rgba(0,0,0,0.7);
        border: 1px solid #FFFFFF;
        border-radius: 4px;
        color: #FFF;
        cursor: pointer;
        display: block;
        font-size: 16px;
        padding: 10px 15px;
        position: fixed;
        right: 0;
        top: 150px;
        z-index: 99999999999;
        width: 300px;
      }
      #hack-answer p#hack-answer-text {
          color: #FFF;
      }
      #hack-answer button#hack-answer-check {
          margin-right: 10px;
      }
      #hack-answer #hack-answer-copy,
      #hack-answer #hack-answer-check{
        border: 1px solid #FFF;
        padding: 5px 10px;
        cursor: pointer;
        background-color: #FFF;
        color: #000;
        margin-top: 10px;
      }
      `;
    document.head.appendChild(style);
  }

  let checkelement = document.getElementById('hack-answer');
  if (checkelement == null) {
    // create a new element Div to display the answer
    const newDiv = document.createElement("div");
    newDiv.setAttribute("id", "hack-answer");
    newDiv.setAttribute("class", "question-multichoice__answer");
    // add inner html to the new div
    newDiv.innerHTML = `<div id="hack-answer-drop" style="padding: 1px 10px;cursor: move;background-color: #FFF;color: #000;margin-bottom: 10px;font-size: 12px;-webkit-user-select: none;  -ms-user-select: none;  user-select: none;  text-align: center;">Drag me</div>`;
    document.body.appendChild(newDiv);
  }
  let textElement = document.getElementById('hack-answer-text');
  if (textElement == null) {
    // create a new element Div to display the answer
    const newDiv = document.createElement("div");
    newDiv.setAttribute("id", "hack-answer-text");
    newDiv.innerText = answer;
    document.getElementById('hack-answer').appendChild(newDiv);
  }
  let checkButton = document.getElementById('hack-answer-check');
  if (checkButton == null) {
    // create a new element Div to display the answer
    const newDiv = document.createElement("button");
    newDiv.setAttribute("id", "hack-answer-check");
    newDiv.setAttribute("class", "btn-answer");
    // add event listener to check the answer
    newDiv.addEventListener("click", function () {
      if (targetWebsite == "linkedin") {
        getAnswer();
      } else if (targetWebsite == "quora") {
        getAnswerForQuora();
      } else if (targetWebsite == "stackoverflow") {
        getAnswerForStackoverflow();
      } else if (targetWebsite == "onlevelup") {
        getAnswerForOnLevelUp();
      } else if (targetWebsite == "classmarker") {
        getAnswerForClassmarker();
      } else {
        setAnswer("this website is not supported yet!");
      }
    });
    newDiv.innerText = "Check Answer";
    document.getElementById('hack-answer').appendChild(newDiv);
    // add  bottum to copy text from p#hack-answer-check
    const newDivCopy = document.createElement("button");
    newDivCopy.setAttribute("id", "hack-answer-copy");
    newDivCopy.setAttribute("class", "btn-answer");
    // add event listener to check the answer
    newDivCopy.addEventListener("click", function () {
      var copyText = document.getElementById("hack-answer-text");
      navigator.clipboard.writeText(copyText.innerText);
    });
    newDivCopy.innerText = "Copy Answer";
    newDivCopy.disabled = true;
    document.getElementById('hack-answer').appendChild(newDivCopy);
  }

  /*
  let checkButtonStop = document.getElementById('hack-answer-stop');
  if (checkButtonStop == null) {
    // create a new element Div to display the answer
    const newDiv = document.createElement("button");
    newDiv.setAttribute("id", "hack-answer-stop");
    newDiv.setAttribute("class", "btn-answer");
    // add event listener to check the answer
    newDiv.addEventListener("click", function () {
      //TODO: stop the process
    });
    newDiv.innerText = "Stop plugin";
    document.getElementById('hack-answer').appendChild(newDiv);
  }*/
  var myDiv = document.getElementById("hack-answer");
  var myDivDrop = document.getElementById("hack-answer-drop");
  var isDragging = false;
  var offset = { x: 0, y: 0 };

  myDivDrop.addEventListener("mousedown", function (event) {
    isDragging = true;
    offset.x = event.offsetX;
    offset.y = event.offsetY;
  });

  myDivDrop.addEventListener("mousemove", function (event) {
    if (isDragging) {
      myDiv.style.left = event.clientX - offset.x + "px";
      myDiv.style.top = event.clientY - offset.y + "px";
    }
  });
// mouse out of the div
  myDivDrop.addEventListener("mouseout", function () {
    isDragging = false;
  });
  myDivDrop.addEventListener("mouseup", function () {
    isDragging = false;
  });
}

function setAnswer(answer) {
  document.getElementById('hack-answer-text').innerText = answer;
}

function getAnswer() {
  var prompt = '';
  var question = '';
  var choices = [];
  setAnswer('Loading...');
  // get element by id
  var title = document.getElementById('assessment-a11y-title');

  if (title != null) {

    // const deleteElement = title.getElementsByClassName('visually-hidden');
    // if (deleteElement.length > 0) {
    //   for (let i = 0; i < deleteElement.length; i++) {
    //     deleteElement[i].remove();
    //   }
    // }

    question = title.textContent.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim();
    prompt = question + '\n';
    // delete the space for each line in textContent

    // get element by class name
    var detail = document.getElementsByClassName('sa-assessment-quiz__title-detail');

    if (detail.length > 0) {
      let code = delete_elements(detail[0].innerHTML);
      prompt += code.textContent.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim() + '\n';
      question += '\n' + code.textContent.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim();
    }
    prompt += "options: \n";
    const options = document.getElementsByClassName('sa-question-multichoice__item');
    for (let i = 0; i < options.length; i++) {
      let opt = delete_elements(options[i].innerHTML);
      prompt += '- ' + opt.textContent.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim() + '\n';
      choices.push(options[i].textContent.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim());

    }

    prompt += "The correct answer should match exactly with one of the possible answers listed above. keep the same language of QCM \n";
    // console.log('prompt:' + prompt);

    // get from chrome.storage.sync.get
    callOpenAI(prompt);

  } else {
    setAnswer('No QCM found!');
  }

}

function getAnswerForOnLevelUp() {
  var prompt = '';
  setAnswer('Loading...');
  // get element by id
  var quiz = document.getElementById('qcm-question');
  if (quiz != null) {
    var title = document.getElementById('qcm-question-title');
    prompt = title.textContent + '\n';
    prompt += "options: \n";
    const options = document.getElementsByClassName('qcm-question-options__item');
    for (let i = 0; i < options.length; i++) {
      prompt += '- ' + options[i].textContent.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim() + '\n';
    }
    prompt += "The correct answer should match exactly with one of the possible answers listed above. keep the same language of QCM \n";

    callOpenAI(prompt);
  } else {
    setAnswer('No QCM found!');
  }
}

function getAnswerForStackoverflow() {
  var prompt = '';
  setAnswer('Loading...');
  const questionElement = document.querySelector('#question-header h1');

  if (questionElement != null) {
    prompt = "I want shortin answer for this question, keep the same language of question  : \n";
    const question = questionElement.textContent.trim();
    prompt += question + '\n';
    const detailsElement = document.querySelector('#question .s-prose.js-post-body');
    prompt += detailsElement.textContent.trim() + '\n';
    console.log(prompt);
    callOpenAI(prompt);
  } else {
    setAnswer('No QCM found!');
  }
}

function getAnswerForQuora() {
  var prompt = '';
  setAnswer('Loading...');
  const questionElement = document.querySelector('.q-box.qu-borderAll .puppeteer_test_question_title');


  if (questionElement != null) {
    prompt = "I want shortin answer for this question, keep the same language of question, give me some source link if exist  : \n";
    const question = questionElement.textContent.trim();
    prompt += question + '\n';
    callOpenAI(prompt);
  } else {
    setAnswer('No QCM found!');
  }
}
function getAnswerForClassmarker() {
  var prompt = '';
  setAnswer('Loading...');
  // get element by id
  const quiz = document.querySelector('ion-list.question-content-area');
  if (quiz != null) {
    var title = document.querySelector('ion-list.question-content-area ion-list-header');
    prompt = title.textContent + '\n';
    prompt += "options: \n";
    const options = document.getElementsByClassName('radio-options-area');
    for (let i = 0; i < options.length; i++) {
      prompt += '- ' + options[i].textContent.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim() + '\n';
    }
    prompt += "The correct answer should match exactly with one of the possible answers listed above. keep the same language of QCM \n";

    callOpenAI(prompt);
  } else {
    setAnswer('No QCM found!');
  }
}

function callOpenAI(prompt) {
  fetch('https://api.openai.com/v1/engines/text-davinci-003/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`
    },
    body: JSON.stringify({
      prompt: prompt,
      max_tokens: 300
    })
  })
    .then(response => response.json())
    .then(data => {
      if (data.error != null) {
        // TODO: convert "\n" to <br>
        setAnswer(data.error.message);
      } else
        if (data.choices.length > 0) {
          const answer = data.choices[0].text;
          setAnswer(answer);
          document.getElementById('hack-answer-copy').disabled = false;
        } else {
          setAnswer('No answer found');
        }

    })
    .catch(error => {
      console.error(error);
      setAnswer('Error plz contact admin');
    });
}