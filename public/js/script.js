const socket = io();

// Elements

const $messageForm = document.getElementById("sendMessage");
const $messageFormInut = $messageForm.querySelector("#message");
const $messageFormButton = $messageForm.querySelector("input[type=submit]");
const $sendLocationButton = document.getElementById('send-location');
const $messages = document.getElementById("messages");

//Options
const {name:username, room} = JSON.parse('{"' + decodeURI(location.search.substring(1)).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}')
console.log(username, room)
if (!username || !room) {
  location.href = '/'
}
socket.emit('join', { username, room}, error => {
  if (error) {
    alert(error)
    location.href = '/'
  }
})

socket.on("botMsg", (message) => {
  appendMessage(message);
});

socket.on("locationMsg", (message) => {
  appendLocationMessage(message);
});

socket.on('roomData', ({ room, users }) => {
  console.log(room)
  console.log(users)
  document.getElementById('roomTitle').textContent = room
  for (let user of users) {
    let p = document.createElement('p')
    p.textContent = user.username
    document.getElementById('roomMembers').appendChild(p)
  }
})

$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  $messageFormButton.setAttribute("disabled", "disabled");

  const formData = new FormData($messageForm);

  const message = formData.get("message");
  $messageFormInut.value = "";

  socket.emit("sendMsg", message, (message) => {
    $messageFormButton.removeAttribute('disabled', 'disabled')
    emitCallback(message);
  });
});

$sendLocationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Your browser not support geolocation.");
  }

  $sendLocationButton.setAttribute('disabled', 'disabled')
  navigator.geolocation.getCurrentPosition((position) => {
    const pos = position.coords;
    socket.emit(
      "sendLocation", 
      `https://google.com/maps?q=${pos.latitude},${pos.longitude}`,
      (message) => {
        $sendLocationButton.removeAttribute('disabled', 'disabled')
        emitCallback(message);
      }
    );
  });
});

const emitCallback = (message) => {
  document.getElementById("flash").textContent = message;
  document.getElementById("flash").style.visibility = "visible";
  setTimeout(() => {
    document.getElementById("flash").style.visibility = "hidden";
    document.getElementById("flash").textContent = "message";
  }, 5000);
};

const selectP = elem => {
  for (let item of $messages.childNodes) {
    if (item == elem) {
      continue
    }
    item.classList = null
  }
  elem.classList.toggle('activep')
}

const appendMessage = (message) => {
  let p = document.createElement("P");
  p.setAttribute('onclick', 'selectP(this)')
  p.innerHTML = `${message}`;
  $messages.insertBefore(p, $messages.firstChild);
};


const appendLocationMessage = (message) => {
  let p = document.createElement('P');
  let a = document.createElement('A');
  a.setAttribute('href', message[1])
  a.setAttribute('target', '_blank')
  a.textContent = '[Click me]'
  p.setAttribute('onclick', 'selectP(this)')
  p.innerHTML = `${message[0]}`;
  p.appendChild(a)
  $messages.insertBefore(p, $messages.firstChild);
};