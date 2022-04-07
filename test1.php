<? require('layout/header.php'); ?>
    <main role="main" m-block="content:TestController">
        <div class="container">
            <div class="row">
                <div class="col-4">
                    <div class="mb-5" m-block="description:TestController2">
                        <p>Lorem ipsum dolor sit amet consectetur, adipisicing elit. Vel beatae officiis soluta magnam est esse reprehenderit, inventore quod, eum nulla nostrum rem possimus eius id odit obcaecati nihil ab. Vero quas repellat eveniet quidem sunt exercitationem, molestiae est, natus magnam quam, ratione quo perferendis voluptatum facere amet laudantium illum beatae?</p>
                        <button @click="click">Click {{ checked }}</button>
                        
                        <p m-if="counter < 103 || counter > 112" style="color:green">less 103 or more 110: <b>{{ counter }}</b></p>
                        <?/*
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
                        */?>
                    </div>
                </div>
                <div class="col-5">
                    <button id="test-btn" @click="click">Custom event</button>
                    <?/*<div m-for="nums" style="margin-top:10px">
                        <span>
                            <i style="display:inline-block;width:100px">{{ key }} -> {{ item }}</i>: 
                            <b style="display:inline-block;width:35px" :style="{color: 'rgb('+Math.round(Math.random()*255)+','+Math.round(Math.random()*255)+','+Math.round(Math.random()*255)+')'}">{{ Math.round(Math.random()*1000) }}</b>
                            <input class="form-control" type="number" min="-10" :max="maxAll" :model.number="item" :style="{ display: 'inline-block', width: (100+(+item))+'px', 'background-color': 'rgb('+Math.round(Math.random()*100+155)+','+Math.round(Math.random()*100+155)+','+Math.round(Math.random()*100+155)+')' }">
                        </span>
                    </div>
                    <p m-for-else :style="warning">Empty</p>
                    */?>
                    <br>
                    <form class="mt-5">
                        <div class="form-group mb-3">
                            <label for="exampleInputEmail1"
                                :style="styles"
                                :class='classes'
                            >Email address</label>
                            <input type="email" class="form-control" placeholder="Enter email" :model="email">
                        </div>
                        <div class="form-group mb-3">
                            <label for="exampleInputPassword1">Password</label>
                            <input type="password" class="form-control" placeholder="Password" :model="password">
                        </div>
                        <div class="form-group mb-3">
                            <label>Age</label>
                            <input type="number" class="form-control" :model="age">
                        </div>
                        <div class="form-group mb-3">
                            <label>Text</label>
                            <textarea class="form-control" minlength="10" maxlength="80" :model="textarea"></textarea>
                        </div>
                        <div class="form-group mb-3">
                            <label>Select</label>
                            <select class="form-select" multiple :model.number="select" style="min-height:150px">
                                <option m-for="options" :value="item.id">{{ item.name }}</option>
                            </select>
                        </div>
                        <div class="form-group mb-3">
                            <label>Radio: {{ radio }}</label>
                            <input class="form-check-input" type="radio" value="1" :model.number="radio">
                            <input class="form-check-input" type="radio" value="2" :model.number="radio">
                        </div>
                        <div class="form-group mb-3">
                            <label>Check: <span m-for="users">{{ item }}, </span></label><br>
                            <div m-for="options">
                                <input type="checkbox" :value="item.id" :model.number="users">
                                <span>: {{ item.name }}</span>
                            </div>
                        </div>
                        <div class="form-check mb-3">
                            <input 
                                type="checkbox" 
                                class="form-check-input" 
                                id="exampleCheck1" 
                                :model="checked"
                            >
                            <label class="form-check-label" for="exampleCheck1">Check me out</label>
                        </div>
                        <button type="submit" class="btn btn-primary">Submit</button>
                    </form>
                </div>
                <?/*<div class="col-2" m-block="author">
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
                */?>
            </div>
            <div class="row">
                <style>
                    #debug span {
                        display: block;
                        margin-bottom: 8px;
                    }
                </style>
                <div class="col">
                    <table id="debug" cellpadding="10"></table>
                </div>
            </div>
        </div>
    </main>
<? require('layout/footer.php'); ?>