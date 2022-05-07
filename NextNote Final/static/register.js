
var password = document.querySelector('#password')
var password_confirm = document.querySelector('#password_confirm')
var register_btn = document.querySelector("#register_btn")

register_btn.disabled = true;

password.addEventListener("input", () => {
    if(password.value == password_confirm.value){
    register_btn.disabled = false;
    }else{
        register_btn.disabled = true;
    }
})

password_confirm.addEventListener("input", () => {
if(password.value == password_confirm.value){
register_btn.disabled = false;
}else{
    register_btn.disabled = true;
}

})
