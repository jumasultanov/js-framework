<? require('layout/header.php'); ?>
    <main role="main" m-block="content:TestController">
        <div class="container" :data-count="counter">
            <div class="row">
                <div class="col-8">
                    <div class="mb-5" m-block="description:TestController">
                        <p :data-count="counter" @click="counter++;">Lorem ipsum dolor sit amet consectetur, adipisicing elit. Vel beatae officiis soluta magnam est esse reprehenderit, inventore quod, eum nulla nostrum rem possimus eius id odit obcaecati nihil ab. Vero quas repellat eveniet quidem sunt exercitationem, molestiae est, natus magnam quam, ratione quo perferendis voluptatum facere amet laudantium illum beatae?</p>
                        <?/*
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
                        */?>
                    </div>
                </div>
                <div class="col-3 offset-1" m-block="author">
                    <div class="mb-5" :name="name">
                        <div><span>Author:</span> <b>{{ author }}</b></div>
                        <div><span>Label:</span> <b>{{ prof }}</b></div>
                        <!--
                        <div m-switch="counter" m-case="105"><span>Count:</span> <b>Сто пять</b></div>
                        <div m-case="106"><span>Count:</span> <b>Сто шесть</b></div>
                        <div m-case="107"><span>Count:</span> <b>Сто семь</b></div>
                        <div m-case="108"><span>Count:</span> <b>Сто восемь</b></div>-->
                    </div>
                    <div class="mb-5" m-block="users">
                        <ul>
                            <li m-for="(user, userIndex, usersArray) in users">
                                <p style="backgound-color:#fefefe;">
                                    <span>ID: {{ user.id }}</span><br>
                                    <span>Name: {{ user.name }}</span>
                                </p>
                            </li>
                            <li m-for-else>
                                <p style="color:#f66;font-weight:bold;">Users not found</p>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </main>
<? require('layout/footer.php'); ?>