
export class State {
  uid:string
  params:Array<Object> = null
  constructor(uid:string,params?:Array<Object>){
    this.uid = uid
    if(params) this.params = params
  }
  static create(uid:string,params?:Array<Object>):State {
    return new State(uid,params)
  }
}

export class Err {
  uid:string
  params:Array<Object> = null
  constructor(uid:string,params?:Array<Object>){
    this.uid = uid
    if(params) this.params = params
  }
  static create(uid:string , params?:Array<Object>):Err {
    return new Err(uid,params)
  }
}

export class Action {
  handler:(stepName:string , state:State , report:(stepName:string,result:State|Err)=>void ) => void
  constructor(handler:(stepName:string , state:State , report:(stepName:string, result:State|Err)=>void ) => void){
    this.handler = handler
  }
  static create(handler:(stepName:string , state:State , report:(stepName:string,result:State|Err)=>void ) => void):Action{
    return new Action(handler)
  }
}

export class Skeleton {
  private belongedFlow:Flowsm = null
  private steps:{} = {}
  private conditions:{} = {}

  private report:(stepName:string,result:State|Err)=>void = (stepName:string,result:State|Err)=>{
    if(result instanceof Err){
      if(this.belongedFlow.errHandler) this.belongedFlow.errHandler(result)
    }else{
      let action = this.getActionByStepName(this.getStepNameByCondition(stepName,result))
      if(!action){
        if(this.belongedFlow.successHandler) this.belongedFlow.successHandler(result)
      }else{
        action.handler(this.getStepNameByCondition(stepName,result),result,this.report)
      }
    }
  }
  private getActionByStepName(name:string):Action {
    return this.steps[name]
  }
  private getStepNameByCondition(fromName:string,state:State):string {
    return this.conditions[`${fromName}@${state.uid}`]
  }

  step(name:string,action:Action):Skeleton{
    this.steps[name] = action
    return this
  }
  condition(fromName:string,state:State,toName:string):Skeleton {
    this.conditions[`${fromName}@${state.uid}`] = toName
    return this
  }
  begin(state:State):void{
    this.getActionByStepName('').handler('',state,this.report)
  }
  setBelongedFlow(flow:Flowsm):void{
    this.belongedFlow = flow
  }
  static create():Skeleton {
    return new Skeleton()
  }
}

export class Flowsm {

  errHandler:(err:Err)=>void = null
  successHandler:(state:State)=>void = null

  private beginState:State = null
  private endState:State = null
  private err:Err = null
  private skeleton:Skeleton = null

  begin(state?:State):Flowsm{
    if(state) this.beginState = state
    this.errHandler = (err:Err)=>{
      this.err = err
    }
    return this
  }

  setSkeleton(skeleton:Skeleton):Flowsm{
    this.skeleton = skeleton
    this.skeleton.setBelongedFlow(this)
    return this
  }

  handleErr(errh:(err:Err)=>void):Flowsm{
    this.errHandler = (err:Err)=>{
      this.err = err
      if(errh) errh(err)
    }
    return this
  }

  end(succh?:(state:State)=>void):void {
    this.successHandler = (state:State)=>{
      this.endState = state
      if(succh) succh(state)
    }
    this.skeleton.begin(this.beginState)
  }

  static create():Flowsm{
    return new Flowsm()
  }
}

