# Software Design - Sketch

[Link to HackMD File](https://tinyurl.com/nikolausdao)

## Idea

> ⚠️ Just a sketch. 

`nikolaus.dao`

> 1 day dao for your scraps imps exchange on December 6.

### Problem

Don't have a present for `scrap imps exchange` gathering.

<details>
<summary>Read More</summary>
    There is a common tradition in many places on December 6 alias Nicholaus day. <br/>
    It called Trash imping.(literally translated from german)<br/> <br/> 
    How does it work?<br/> 
    You buy something funny for a certain defined range of value.<br/> 
    f.e. something funny for around 10 bucks. <br/> 
    You come together with your friends.<br/> 
    Everyone throws his thingy in. <br/> 
    It gets redistrubed. <br/> 
    Some people are happy, some people are sad but everyone had a big fun <br/> 
    
   Ok now we know whats trash imping.
   
   Nikolaus DAO is a group of people.
   Everyone can joins and throws his 3D prompt in.
   The contracts stores it.
   A 3d Models gets created and stored on the chain.
   Everything is own by you.
   
   December 6 is happening.
   
   All the 3d models are getting randomly redistrubted.
   All of them get printed and send to their new owners.
      Now you are the proud owner of a 3d modeled present created by one of your Nikolaus fellow.
      
Happy Nikolaus Day 🎁
   
    
</details>

### Solution

`nikolaus.dao`

## Requirements

### Functional Requirments

- The User should be able to become a member
- The User should be able to participate
- The SmartContract should handle the distrubiton
- The Backend should be able create ai 3D Model
- The Backend should be able to add 3D Model to chain

### Non Functional Requirmentens

- The WebApp should have a simple UI

## Diagrams

### UseCase

```plantuml
!theme plain
left to right direction
skinparam actorStyle awesome

Backend --> ("create 3D")
Backend --> ("add to Chain")
SmartContract --> (redistribute)
User --> (become Member)
User --> (participate)

```

### Class

```plantuml
class NikolausDAO{
    +members: address[]
    +prompts: string[]
    +models: cid[]
    +picture: cid[]
    
    +become_member()
    +add_prompt()
    +add_model()
    +get_all_model()
    +get_model()
}
```

### Sequence

```plantuml
actor User
entity WebApp
entity Backend
database SmartContract
group Members joins
Backend -> SmartContract: "listens"
User -> WebApp: "become_member('prompt')"
WebApp -> SmartContract: "become_member('prompt')"
Backend -> Backend: "create 3D, create cid"
Backend -> SmartContract: "add_models('user')"

end

group "6th December"
SmartContract -> SmartContract: "redistrubed"
Backend -> Backend: "print"
Backend -> User: "delivered"
end
```

<details>
<summary>Show more</summary>
 <img src="https://i.ibb.co/8PSHLg2/image.png" widht=500 height=250/>
</details>

## Notes

- Wanna add webar and show all presents on your nikloaus dao plate. (lets see, time consuming)
- w.i.p.
