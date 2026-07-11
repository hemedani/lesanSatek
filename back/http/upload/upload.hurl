##### Register User ############################
POST {{serverAddress}}/user/registerUser
{
    "details": {
        "set": {
            "first_name": "Maryam",
            "last_name": "Ragheb",
            "email": "maryam@example.com",
            "password": "password123",
            "mobile": "09107447219",
            "gender": "Female"
        },
        "get": {
            "_id": 1,
            "email": 1
        }
    }
}

##### Login ############################
POST {{serverAddress}}/user/login
{
    "details": {
        "set": {
            "email": "maryam@example.com",
            "password": "password123"
        },
        "get": {
            "token": 1,
            "user": { "_id": 1 }
        }
    }
}

HTTP 200
[Captures]
token: jsonpath "$['body']['token']"

##### Upload Image ############################
POST {{serverAddress}}/file/uploadFile
Authorization: "{{token}}"

[MultipartFormData]
lesan-body: {"details":{"get":{"name":1,"mimeType":1,"size":1},"set":{"type":"image"}}}
image: file,sample.jpeg; image/jpeg

##### Upload Document ############################
POST {{serverAddress}}/file/uploadFile
Authorization: "{{token}}"

[MultipartFormData]
lesan-body: {"details":{"get":{"name":1,"mimeType":1,"size":1},"set":{"type":"docs"}}}
file: file,sample.pdf; application/pdf