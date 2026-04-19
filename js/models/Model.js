export default class Model {
    constructor() {
        if (new.target === Model) throw new Error("Creating instances of Model class is restricted. Create children instead.");
    }
    
    get table() {
        throw new Error('Only child class allowed to use this getter');
    }
    
    save() {
        throw new Error('You have to implement this method in child class.');
    }
}