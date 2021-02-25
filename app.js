//contentful
const client = contentful.createClient({
    // This is the space ID. A space is like a project folder in Contentful terms
    space: "ilqnytcp9rf6",
    // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
    accessToken: "6HJFwoseqezL08h7eNjmi30iu-ewKMYPMJ91NIQboTQ"
  });
//   console.log(client);

// variables

const cartBtn = document.querySelector('.cart-btn')
const closeCartBtn = document.querySelector('.close-cart')
const clearCartBtn = document.querySelector('.clear-cart')
const cartOverlay = document.querySelector('.cart-overlay')
const cartDOM = document.querySelector('.cart')
const cartItems = document.querySelector('.cart-items')
const cartTotal = document.querySelector('.cart-total')
const cartContent = document.querySelector('.cart-content')
const productDOM = document.querySelector('.products-center')

// cart
let cart = [];

let buttonDOM = [];

// getting products
class Products{
    async getProducts(){
        try{
            //contentful api
            const contentful = await client.getEntries({
                content_type : 'ComfyHouseProductExample'
            });
            console.log(contentful);

            let result = await fetch('products.json');
            let data = await result.json();

            let products = contentful.items;
            // console.log(products)
            products = products.map(item=>{
                const {title,price} = item.fields;
                const {id} = item.sys;
                const image = item.fields.image.fields.file.url;
                return {title,price,id,image} 
            })
            // console.log(products);
            return products;
        }catch(e){
            console.log(e);
        }
    }
}

//display products
class UI{
    displayProducts(products){
        // console.log(products)
        let result = '';
        products.forEach(product => {
            result +=  `
                <article class = 'product'>
                    <div class="img-container">
                        <img src=${product.image}
                            alt="product" 
                            class = 'product-img'>
                        <button class="bag-btn" data-id = ${product.id}>
                            <i class="fas fa-shopping-cart"></i>
                            add to cart
                        </button>
                    </div>
                    <h3>${product.title}</h3>
                    <h4>$${product.price}</h4>
                </article>
            `;
        });
        // console.log(result)
        productDOM.innerHTML = result;
    }

    getBagButtons(){
        let bagBtns = [...document.querySelectorAll('.bag-btn')];
        buttonDOM = bagBtns;
        bagBtns.forEach((bagBtn)=>{
            let id = bagBtn.getAttribute('data-id');
            let inCart = cart.find(item=>item.id===id);
            if (inCart){
                bagBtn.innerText = 'already in cart';
                bagBtn.disabled = true; 
            }
            bagBtn.addEventListener('click', (event)=>{
                event.target.innerText = 'already in cart';
                event.target.disabled = true;
                // getting the single product from products
                let cartItem = {...Storage.getProduct(id),amount:1};
                // console.log(cartItem);
                //adding product to cart
                cart = [...cart,cartItem];
                //save cart in localstorage
                Storage.saveCart(cart);
                //set the total cart value
                this.setCartValue(cart);
                //add item to the cart
                this.addCartItem(cartItem);
                //showing the cart
                this.showCart();
            })
        })
    }

    setCartValue(cart){
        let tempTotal = 0;
        let itemsTotal = 0;
        cart.map(item=>{
            tempTotal += item.price * item.amount;
            // console.log(tempTotal);
            itemsTotal += item.amount;
            // console.log(itemsTotal);
        })
        cartTotal.innerHTML = parseFloat(tempTotal.toFixed(2));
        // console.log(cartTotal)
        cartItems.innerHTML = itemsTotal; 
    }

    addCartItem(item){
        const div = document.createElement('div');
        div.classList.add('cart-item');
        div.innerHTML = `
            <img src="${item.image}" 
                alt="product">
            <div>
                <h4>${item.title}</h4>
                <h5>$${item.price}</h5>
                <span class='remove-item' data-id=${item.id}>remove</span>
            </div> 
            <div>
                <i class="fas fa-chevron-up" data-id=${item.id}></i>
                <p class = 'item-amount'>${item.amount}</p>
                <i class="fas fa-chevron-down" data-id=${item.id}></i>
            </div> `
        cartContent.appendChild(div);  
        // console.log(cartContent)  
    }

    showCart(){
        cartOverlay.classList.add('transparentBcg');
        cartDOM.classList.add('showCart');
    }

    setupApp(){
        cart = Storage.getCart();
        this.setCartValue(cart);
        this.populateCart(cart);
        cartBtn.addEventListener('click',this.showCart);
        closeCartBtn.addEventListener('click',this.hideCart);
    }
    hideCart(){
        // console.log(this);
        cartOverlay.classList.remove('transparentBcg');
        cartDOM.classList.remove('showCart');
    }

    populateCart(cart){
        // console.log(this);
        cart.forEach(item=>this.addCartItem(item));
    }

    //Cart Logic
    cartLogic(){
        clearCartBtn.addEventListener('click',this.clearCart.bind(this));
        cartContent.addEventListener('click',event =>{
            if(event.target.classList.contains('remove-item')){
                let removeCartItem = event.target;
                let id = removeCartItem.getAttribute('data-id');
                this.removeItem(id);
                cartContent.removeChild(removeCartItem.parentElement.parentElement);
            }
            else if (event.target.classList.contains('fa-chevron-up')){
                let addAmount = event.target;
                let id = addAmount.getAttribute('data-id');
                let tempItem = cart.find(item => item.id===id);
                tempItem.amount += 1;
                Storage.saveCart(cart);
                this.setCartValue(cart);
                addAmount.nextElementSibling.innerText = tempItem.amount;
            }
            else if (event.target.classList.contains('fa-chevron-down')){
                let removeAmount = event.target;
                let id = removeAmount.getAttribute('data-id');
                let tempItem = cart.find(item => item.id===id);
                tempItem.amount -= 1;
                if(tempItem.amount > 0){
                    Storage.saveCart(cart);
                    this.setCartValue(cart);
                    removeAmount.previousElementSibling.innerText = tempItem.amount;
                }else{
                    cartContent.removeChild(removeAmount.parentElement.parentElement);
                    this.removeItem(id);
                }
            }
        });
    }
    clearCart(){
        const cartItems = cart.map(item => item.id);
        // console.log(cartItems);
        cartItems.forEach(id => this.removeItem(id));
        while(cartContent.children.length > 0){
            cartContent.removeChild(cartContent.children[0])
        }
        this.hideCart();
    }
    removeItem(id){
        cart = cart.filter(item=>item.id!==id);
        this.setCartValue(cart);
        Storage.saveCart(cart);
        let button  = this.getSingleBtn(id);
        button.disabled = false;
        button.innerHTML = `<i class="fas fa-shopping-cart"></i>
        add to cart`;

    }
    getSingleBtn(id){
        return buttonDOM.find(button=>button.getAttribute('data-id')===id)
    }

}

//local storage
class Storage{
    //save products in the localstorage
    static saveProducts(products){
        // console.log(localStorage)
        localStorage.setItem('products',JSON.stringify(products))
    }

    //get products from the localstorage
    static getProduct(id){
        let products = JSON.parse(localStorage.getItem('products'));
        // console.log(products)
        return products.find(product=>product.id===id)
    }

    //save cart in localstorage
    static saveCart(cart){
        localStorage.setItem('cart',JSON.stringify(cart));
    }
    //get cart 
    static getCart(){
        return localStorage.getItem('cart')
                    ?JSON.parse(localStorage.getItem('cart'))
                    :[]
    }
}

document.addEventListener('DOMContentLoaded',()=>{
    const ui = new UI();
    const data = new Products();

    //showing cart if its prepopulated
    ui.setupApp()

    //getting the products
    data.getProducts()
        .then(products=>{
            ui.displayProducts(products);
            Storage.saveProducts(products);
        })
        .then(()=>{
            ui.getBagButtons();
            ui.cartLogic();
        });
})




