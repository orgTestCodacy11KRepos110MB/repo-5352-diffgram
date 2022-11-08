import { get_instance_list_from_task } from "../../services/instanceServices";
import { getFollowingTask } from "../../services/tasksServices"

//
// How does this calss should work:

// 1. Constructor called with project_string_id and optionally can be passed prefetch_number_of_tasks
// 2. On teh contructor prfect next and previous tasks, and set ethem to the class
// 3. When the next task is called, insteead if doing immidiate API call, we will check if the next task is on the state
//         a. If it on the state -  we don't do API call, get it from the state and then do a call for cashe more tasks
//         b. if there is nothing on the state (for exmaple switching too fast) - we do an API call
//

export default class TaskPrefetcher {
  current_task: any
  cached_next_tasks: any[] = [];
  cached_next_images: any[] = [];
  cached_next_annotations: any[] = [];

  cached_previous_tasks: any[] = [];
  cached_previous_images: any[] = [];
  cached_previous_annotations: any[] = [];
  
  project_string_id: string;
  prefetch_number_of_tasks: number

  constructor(
    project_string_id: string, 
    prefetch_number_of_tasks: number = 1
  ) {
    this.project_string_id = project_string_id
    this.prefetch_number_of_tasks = prefetch_number_of_tasks
  }

  async update_tasks(task: any) {
    this.current_task = task
    this.prefetch_next_task()
    this.prefetch_previous_task()
  }

  async prefetch_image(src: string, image_array: Array<any>) {
      const image = new Image()
      image.src = src
      image.onload = () => image_array.push(image)
  }

  async prefetch_instances(task_id: number, instances_array: Array<any>) {
    const response = await get_instance_list_from_task(this.project_string_id, task_id)
    instances_array.push(response)
  }

  async prefetch_next_task() {
    const [result, error] = await getFollowingTask(
      this.project_string_id,
      this.current_task.id,
      this.current_task.job_id,
      'next',
      false
    )

    await this.prefetch_image(result.task.file.image.url_signed, this.cached_next_images)
    await this.prefetch_instances(result.task.id, this.cached_next_annotations)
    
    this.cached_next_tasks.push(result.task)
  }

  async prefetch_previous_task() {
    const [result, error] = await getFollowingTask(
      this.project_string_id,
      this.current_task.id,
      this.current_task.job_id,
      'previous',
      false
    )

    if (!error && result.task) {
      await this.prefetch_image(result.task.file.image.url_signed, this.cached_previous_images)
      await this.prefetch_instances(result.task.id, this.cached_previous_annotations)
      
      this.cached_previous_tasks.push(result.task)
    }
  }

  async change_task(direction: string) {
    let new_task: any;
    let new_image: any;
    let new_instances: any;

    if (direction === 'next') {
      if (this.cached_next_tasks.length === 0) await this.prefetch_next_task()
      new_task = this.cached_next_tasks.splice(0, 1);
      new_image = this.cached_next_images.splice(0, 1);
      new_instances = this.cached_next_annotations.splice(0, 1);
    }
    
    if (direction === 'previous') {
      if (this.cached_previous_tasks.length === 0) await this.prefetch_previous_task()
      const last_index = this.cached_previous_tasks.length - 1
      new_task = this.cached_previous_tasks.splice(last_index, 1);
      new_image = this.cached_previous_images.splice(last_index, 1);
      new_instances = this.cached_previous_annotations.splice(last_index, 1);
    }
    
    return {
      task: new_task[0],
      image: new_image[0],
      instances: new_instances[0]
    }
  }
} 