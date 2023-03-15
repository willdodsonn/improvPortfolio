// window.alert("Script is working")

const displayTime = () => {
    let now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();

    minutes = (minutes < 10 ? "0" : "") + minutes;
    seconds = (seconds < 10 ? "0" : "") + seconds;

    let period = (hours < 12 ? "AM" : "PM");
    
    hours = (hours > 12) ? hours - 12 : hours;
    hours = (hours === 0) ? 12 : hours;

    let clock = document.getElementById("time");

    clock.textContent = hours + ":" + minutes + " " + period;


    setTimeout(displayTime, 1000)
}

displayTime()