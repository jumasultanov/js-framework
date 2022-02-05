<? require('layout/header.php'); ?>
    <main role="main" m-block="content:TestController">
        <div class="container">
            <div class="row">
                <div class="col-4">
                    <?/*
                    <div class="mb-5" m-block="description:TestController">
                        <p :data-count="counter" @click="counter++;">Lorem ipsum dolor sit amet consectetur, adipisicing elit. Vel beatae officiis soluta magnam est esse reprehenderit, inventore quod, eum nulla nostrum rem possimus eius id odit obcaecati nihil ab. Vero quas repellat eveniet quidem sunt exercitationem, molestiae est, natus magnam quam, ratione quo perferendis voluptatum facere amet laudantium illum beatae?</p>
                        <button @click="click">change INNER {{ customVar3 }}</button>
                        
                        <p m-if="counter < 103 || counter > 112" style="color:green">less 103 or more 110: <b>{{ counter }}</b></p>
                        <p m-else-if="counter < 106 || counter > 110" style="color:blue">less 106 or more 110: <b>{{ counter }}</b></p>
                        <p m-else style="color:red">more 105: <b>{{ counter }}</b></p>

                        <p m-if="previewText == 'test'">
                            <span>TEST STRING {{ counter }}</span>
                        </p>
                        <p m-else-if="previewText" :data-count="counter">
                            <i>I:</i><br>
                            <span m-block="descriptionPreview:TestController2"><span>Start preview text: {{ previewText }} = {{ desc }}</span></span>
                        </p>
                        <p m-else>Preview text not found</p>
                    </div>
                    */?>
                    <div class="mb-5" m-block="users:TestController">
                        <ul>
                            <li m-for="(user, userIndex, usersArray) in users">
                                <p style="backgound-color:#fefefe;">
                                    <span><button @click="removeUser(userIndex)">X: {{ userIndex }}</button></span>
                                    <span>ID: {{ user.id+'#'+user.id }};</span>
                                    <span>Name: {{ user.name }}{{ (user.prof?';':'') }}</span>
                                    <span m-if="user.prof">Prof: {{ user.prof }};</span>
                                    <span m-if="user.cat">Has cat</span>
                                </p>
                            </li>
                            <li m-for-else>
                                <p style="color:#f66;font-weight:bold;">Users not found</p>
                            </li>
                        </ul>
                    </div>
                </div>
                <div class="col-5">
                    <div class="mb-3">
                        <button @click="users.push({id: 8, name: 'Elisabeth'});">Push</button>
                        <button @click="users.pop()">Pop</button>
                        <button @click="users.shift()">Shift</button>
                        <button @click="users.unshift({id: 99, name: 'Anna'})">Unshift</button>
                    </div>
                    <div class="mb-3">
                        <button @click="users.sort((a,b) => a.id-b.id)">Sort</button>
                        <button @click="users.reverse()">Reverse</button>
                    </div>
                    <div class="mb-3">
                        <button @click="users.splice(2,0,{id:14,name:'Jack'})">Splice (add)</button>
                        <button @click="users.splice(1,1,{id:15,name:'Susan'})">Splice (replace)</button>
                        <button @click="users.splice(3,1)">Splice (remove)</button>
                    </div>
                    <div class="mb-3">
                        <button @click="users.splice(3,2,{id:20,name:'Casie'})">Splice (remove more add)</button>
                        <button @click="users.splice(3,1,{id:21,name:'Michael'},{id:22,name:'Nancy'})">Splice (add more remove)</button>
                    </div>
                    <button @click="changeUser(0)">Change user 1 to Mary</button>
                </div>
                <div class="col-2" m-block="author">
                    <div class="mb-5" @click="counter++">
                        {{ counter }}
                        <div><span>Author:</span> <b>{{ author }}</b></div>
                        <div><span>Label:</span> <b>{{ prof }}</b></div>
                        <div class="mb-3" m-if="user.name.short=='Samuel'"><span>Short:</span> <b>{{ user.name.short }}</b></div>
                        <div class="mb-2"><button @click="user.name.short = 'Sam'">Change short</button></div>
                        <div class="mb-2"><button @click="user.name.short = 'Samuel'">Change full</button></div>
                        <!--
                        <div m-switch="counter" m-case="105"><span>Count:</span> <b>Сто пять</b></div>
                        <div m-case="106"><span>Count:</span> <b>Сто шесть</b></div>
                        <div m-case="107"><span>Count:</span> <b>Сто семь</b></div>
                        <div m-case="108"><span>Count:</span> <b>Сто восемь</b></div>-->
                    </div>
                </div>
            </div>
        </div>
    </main>
<? require('layout/footer.php'); ?>