import { LoaderFunction, json, ActionFunction } from "@remix-run/node";
import { useEffect, useRef, useState } from "react";
import { useLoaderData, useFetcher, Link } from "@remix-run/react";
import prisma from "../utils/db";
import { SparklesCore } from "../../components/ui/sparkles";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectGroup,
  SelectLabel,
  SelectValue,
} from "../components/ui/select";

type TaskResponse = {
  error?: string;
  message?: string;
  newSubTask?: {
    title?: string;
    status?: string;
    taskId?: string;
    id?: string;
  };
};

const selectTaskStatus = ["pending", "completed", "cancelled"];

export const loader: LoaderFunction = async ({ params }) => {
  const { id } = params;
  console.log(id);
  if (!id) {
    throw new Response("Task ID missing", { status: 400 });
  }

  const task = await prisma.task.findUnique({
    where: { id: id },
    select: {
      id: true,
      category: true,
      subTasks: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
  });

  if (!task) {
    throw new Response("Task not found", { status: 404 });
  }

  return json(task);
};

export default function TaskDetail() {
  const task = useLoaderData<{
    id: string;
    category: string;
    subTasks: {
      id: string;
      title: string;
      status: string;
    }[];
  }>();

  const fetcher = useFetcher<TaskResponse>();

  const formRef = useRef<HTMLFormElement>(null); // Form reference

  const [error, setError] = useState<string | null>(null);
  // Form reset jab submission complete ho jaye
  useEffect(() => {
    if (fetcher.state === "idle") {
      formRef.current?.reset();
      if (fetcher.data?.error) {
        setError(fetcher.data.error);
      } else {
        setError(null);
      }
    }
  }, [fetcher.state, fetcher.data]);

  const subtasks = task.subTasks;
  return (
    <div className="h-screen w-full relative bg-black text-white  overflow-hidden flex justify-center">
      <div className="w-full absolute inset-0 h-screen ">
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={100}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>
      <div className=" absolute top-10 left-4  ">
        <Link
          to={"/tasks"}
          className="px-3 transition-all duration-200 inline-block hover:scale-110"
        >
          <i className="ri-arrow-left-line ">
            <span
              className="px-2 max-sm:hidden
              "
            >
              Tasks Category
            </span>
          </i>
        </Link>
      </div>
      <div className="w-[60%] max-sm:w-[95%] flex flex-col z-30">
        <div className=" text-center mt-8 text-2xl z-10 ">
          {task.category
            .split(" ")
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join(" ")}
        </div>
        <h1 className="py-4 px-[3%] text-xl max-sm:text-lg ">Add Sub Task</h1>
        <div className="">
          <fetcher.Form method="post" ref={formRef} className="flex">
            <input type="hidden" name="taskId" value={task.id} />
            <input
              type="text"
              name="title"
              placeholder="Enter your task"
              required
              className="w-[65%] py-2  rounded-2xl text-center  focus:outline-none bg-transparent text-white caret-white border border-[#645f5f] hover:border-[#afa3a3] "
            />

            <Select name="status">
              <SelectTrigger className="w-[30%] mx-4 text-center py-2 appearance-none border rounded-2xl border-[#645f5f] hover:border-[#afa3a3] bg-transparent cursor-pointer text-white text-md">
                <SelectValue placeholder="Status" className="text-white" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Status</SelectLabel>
                  {selectTaskStatus.map((status) => (
                    <SelectItem
                      key={status}
                      value={status}
                      className="bg-black font-normal text-white border-none focus:bg-black focus:text-white"
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <input type="hidden" name="actionType" value="add" />
            <button type="submit">
              <i className="ri-add-large-fill text-white text-[18px] p-1 hover:text-black hover:bg-white rounded-full"></i>{" "}
            </button>
          </fetcher.Form>
          {error && <p className="text-red-600">{error}</p>}
        </div>

        {subtasks.length > 0 ? (
          subtasks.map((subTask, i) => (
            <div key={i} className="flex w-full mt-4">
              <div className="mx-3 text-lg max-sm:text-sm">{i + 1}.</div>
              <div className="flex justify-between w-full">
                <div className="  max-sm:text-sm text-xl ">
                  {subTask.title
                    .split(" ")
                    .map(
                      (word) =>
                        word.charAt(0).toUpperCase() +
                        word.slice(1).toLowerCase()
                    )
                    .join(" ")}{" "}
                </div>
                <div className="flex justify-between w-[35%] max-sm:w-[40%]  max-sm:text-sm text-lg">
                  <div>
                    {subTask.status
                      .split(" ")
                      .map(
                        (word) =>
                          word.charAt(0).toUpperCase() +
                          word.slice(1).toLowerCase()
                      )}
                  </div>
                  <fetcher.Form method="post" className="">
                    <input type="hidden" name="subTaskId" value={subTask.id} />
                    <input type="hidden" name="taskId" value={task.id} />

                    <input type="hidden" name="actionType" value="delete" />
                    <button type="submit" className="">
                      <i className="ri-subtract-line text-white text-[24px] hover:text-black hover:bg-white rounded-full max-sm:text-md "></i>
                    </button>
                  </fetcher.Form>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>No Subtasks available!</p>
        )}
      </div>
    </div>
  );
}
export const action: ActionFunction = async ({ request }) => {
  console.log(request);

  const formData = await request.formData();
  const title = formData.get("title") as string;
  const status = formData.get("status") as string;
  const subTaskId = formData.get("subTaskId") as string;
  const taskId = formData.get("taskId") as string;
  const actionType = formData.get("actionType") as string;
  if (actionType === "delete") {
    if (!subTaskId) {
      return json({ error: "Task ID is required" }, { status: 400 });
    }

    try {
      await prisma.subTask.delete({
        where: { id: subTaskId },
      });
      return json({ success: true });
    } catch (error) {
      return json(
        { error: "Task not found or could not be deleted" },
        { status: 400 }
      );
    }
  }
  if (!taskId) {
    return json({ error: "Task ID is required" }, { status: 400 });
  }

  const newSubTaskCount = await prisma.subTask.count({
    where: {
      title: title,
    },
  });
  if (newSubTaskCount > 0) {
    return json({ error: `Task already declared` }, { status: 400 });
  }
  const newSubTask = await prisma.subTask.create({
    data: {
      title,
      status,
      task: { connect: { id: taskId } },
    },
  });

  console.log(
    `task created : ${newSubTask.title} , ${newSubTask.status}, ${newSubTask.taskId} , ${newSubTask.id}`
  );
  return json({ newSubTask });
};
