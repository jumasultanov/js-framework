<? require('layout/header.php'); ?>
    <main role="main" m-block="content:TestController">
        <div class="container" :data-count="counter">
            <button @click="click">change TOP {{ customVar3 }}</button>
            <div class="row">
                <div class="col-8">
                    <div class="mb-5" m-block="description:TestController" :data-count="counter">
                        <p @click="counter++;">Lorem ipsum dolor sit amet consectetur, adipisicing elit. Vel beatae officiis soluta magnam est esse reprehenderit, inventore quod, eum nulla nostrum rem possimus eius id odit obcaecati nihil ab. Vero quas repellat eveniet quidem sunt exercitationem, molestiae est, natus magnam quam, ratione quo perferendis voluptatum facere amet laudantium illum beatae?</p>
                        <button @click="click">change INNER {{ customVar3 }}</button>
                        
                        <p m-if="previewText" :data-count="counter">
                            <i>I:</i><br>
                            <span m-block="descriptionPreview"><span>Start preview text: {{ previewText }}</span></span>
                        </p>
                        <p m-else-if="previewText == 'test'">
                            <span>TEST STRING {{ counter }}</span>
                        </p>
                        <p m-else>Preview text not found</p>
                        <p :data-count="counter">COUNTER: {{ counter }}</p>
                    </div>
                </div>
                <div class="col-3 offset-1" m-block="author:TestController2">
                    <div class="mb-5" :name="name">
                        <div><span>Author:</span> <b>{{ author }}</b></div>
                        <div><span>Label:</span> <b>{{ prof }}</b></div>
                        <!--
                        <div m-switch="counter" m-case="105"><span>Count:</span> <b>Сто пять</b></div>
                        <div m-case="106"><span>Count:</span> <b>Сто шесть</b></div>
                        <div m-case="107"><span>Count:</span> <b>Сто семь</b></div>
                        <div m-case="108"><span>Count:</span> <b>Сто восемь</b></div>-->
                    </div>
                    <div class="mb-5" m-block="works">
                        <ul>
                            <!--<li for="work in works">
                                <span>name: {{ work.name }}</span><br>
                                <span>type: {{ work.type }}</span>
                            </li>-->
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </main>
<? require('layout/footer.php'); ?>